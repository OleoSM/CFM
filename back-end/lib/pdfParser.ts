import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configurar worker
if (typeof window === 'undefined') {
    // Server-side
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.js';
}

export interface ParsedQuestion {
    questionText: string;
    options: string[];
    correctIndex: number;
    hint: string;
    confidence: number;
}

export async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + ' ';
    }

    return fullText;
}

function normalizeText(text: string): string {
    if (!text) return '';
    let normalized = text;

    // Corregir acentos malformados
    normalized = normalized
        .replace(/([a-zA-Z])\s*´\s*a/g, '$1á')
        .replace(/([a-zA-Z])\s*´\s*A/g, '$1Á')
        .replace(/([a-zA-Z])\s*´\s*e/g, '$1é')
        .replace(/([a-zA-Z])\s*´\s*E/g, '$1É')
        .replace(/([a-zA-Z])\s*´\s*i/g, '$1í')
        .replace(/([a-zA-Z])\s*´\s*I/g, '$1Í')
        .replace(/([a-zA-Z])\s*´\s*o/g, '$1ó')
        .replace(/([a-zA-Z])\s*´\s*O/g, '$1Ó')
        .replace(/([a-zA-Z])\s*´\s*u/g, '$1ú')
        .replace(/([a-zA-Z])\s*´\s*U/g, '$1Ú')
        .replace(/\s*´\s*a/g, 'á')
        .replace(/\s*´\s*e/g, 'é')
        .replace(/\s*´\s*i/g, 'í')
        .replace(/\s*´\s*o/g, 'ó')
        .replace(/\s*´\s*u/g, 'ú')
        .replace(/´/g, '');

    // Corregir ñ malformada
    normalized = normalized
        .replace(/([a-zA-Z])?\s*˜\s*n/g, '$1ñ')
        .replace(/([a-zA-Z])?\s*˜\s*N/g, '$1Ñ')
        .replace(/([a-zA-Z])?\s*~\s*n/g, '$1ñ')
        .replace(/([a-zA-Z])?\s*~\s*N/g, '$1Ñ');

    // Normalizar Unicode
    normalized = normalized.normalize('NFC');

    // Corregir palabras interrumpidas
    normalized = normalized.replace(/(\w+)-\s+(\w+)/g, '$1$2');
    normalized = normalized.replace(/(\w+)\s*\n\s*(\w+)/g, '$1$2');

    // Limpiar caracteres especiales
    normalized = normalized
        .replace(/[–—−]/g, '-')
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

    return normalized;
}

export function parseQuizText(text: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const cleanText = normalizeText(text);
    let blocks: string[] = [];

    // Detectar patrón de numeración
    if (/\b\d+\.-/.test(cleanText)) {
        blocks = cleanText.split(/(?=\b\d+\.-\s?)/g);
    } else if (/\b\d+\.\s+[A-ZÁÉÍÓÚÑ¿]/.test(cleanText)) {
        blocks = cleanText.split(/(?=\b\d+\.\s+)/g);
    } else if (/\b\d+\)\s/.test(cleanText)) {
        blocks = cleanText.split(/(?=\b\d+\)\s)/g);
    } else if (/\b\d+\s+¿/.test(cleanText)) {
        blocks = cleanText.split(/(?=\b\d+\s+¿)/g);
    } else if (/\b\d+\s+[A-ZÁÉÍÓÚÑ]/.test(cleanText)) {
        blocks = cleanText.split(/(?=\b\d+\s+[A-ZÁÉÍÓÚÑ])/g);
    }

    blocks.forEach((block) => {
        if (!block.includes('A)') && !block.includes('a)')) return;

        try {
            const parts = block.split(/\s+[Aa][).\-]+\s+/);
            if (parts.length < 2) return;

            let questionText = parts[0].replace(/^\d+[.\-\)\s]+/, '').trim();
            if (!questionText || questionText.length < 5) return;

            const optParts = parts.slice(1).join(' A) ').split(/\s+[BbCcDd][).\-]+\s+/);
            if (optParts.length < 4) return;

            let options = [optParts[0], optParts[1], optParts[2], optParts[3]].map(o => o.trim());

            let hint = 'Sin pista disponible.';
            const hintMatch = options[3].match(/(?:\s+P\)\s*|\s+PISTA\s*[:.-]?\s*)(.*)$/i);
            if (hintMatch) {
                hint = hintMatch[1].trim();
                options[3] = options[3].replace(hintMatch[0], '').trim();
            }

            const nextQuestion = options[3].match(/\s+\d+[).\-]/);
            if (nextQuestion) {
                options[3] = options[3].substring(0, nextQuestion.index).trim();
            }

            let correctIndex = 0;
            const checkPatterns = /[✓✔☑✅√▸►●•∙]/;
            options = options.map((opt, i) => {
                if (checkPatterns.test(opt) || opt.toLowerCase().includes('(correcta)')) {
                    correctIndex = i;
                }
                return opt
                    .replace(/[✓✔☑✅√▸►●•∙]/g, '')
                    .replace(/\(correcta\)/gi, '')
                    .replace(/\(correcto\)/gi, '')
                    .replace(/^\s*[-_]\s*/, '')
                    .trim();
            });

            if (options.some(o => !o)) return;

            const confidence = calculateConfidence(questionText, options);

            questions.push({
                questionText,
                options,
                correctIndex,
                hint,
                confidence
            });
        } catch (e) {
            console.error('Error parsing question block:', e);
        }
    });

    return questions;
}

function calculateConfidence(questionText: string, options: string[]): number {
    let score = 1.0;

    if (!questionText || questionText.length < 10) score -= 0.3;
    if (options.length !== 4) score -= 0.4;
    if (options.some(opt => !opt || opt.length < 2)) score -= 0.3;

    return Math.max(0, Math.min(1, score));
}

export async function extractQuestionsFromPDF(pdfBuffer: ArrayBuffer): Promise<ParsedQuestion[]> {
    const text = await extractTextFromPDF(pdfBuffer);
    return parseQuizText(text);
}
