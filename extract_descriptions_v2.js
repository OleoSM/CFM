const fs = require('fs');
const path = require('path');

// Usaremos la versión CommonJS de pdfjs
const pdfjsLib = require('pdfjs-dist');

// No necesitamos configurar worker en Node.js

function normalizeText(text) {
    if (!text) return "";
    let normalized = text;

    normalized = normalized
        .replace(/([a-zA-Z])\s*\u00B4\s*a/g, '$1á')
        .replace(/([a-zA-Z])\s*\u00B4\s*A/g, '$1Á')
        .replace(/([a-zA-Z])\s*\u00B4\s*e/g, '$1é')
        .replace(/([a-zA-Z])\s*\u00B4\s*E/g, '$1É')
        .replace(/([a-zA-Z])\s*\u00B4\s*i/g, '$1í')
        .replace(/([a-zA-Z])\s*\u00B4\s*I/g, '$1Í')
        .replace(/([a-zA-Z])\s*\u00B4\s*o/g, '$1ó')
        .replace(/([a-zA-Z])\s*\u00B4\s*O/g, '$1Ó')
        .replace(/([a-zA-Z])\s*\u00B4\s*u/g, '$1ú')
        .replace(/([a-zA-Z])\s*\u00B4\s*U/g, '$1Ú')
        .replace(/\u00B4/g, '');

    normalized = normalized.normalize("NFC");
    normalized = normalized
        .replace(/[–—−]/g, '-')
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        .replace(/\s+/g, " ")
        .trim();

    return normalized;
}

function parseUnitDescriptions(text) {
    const normalized = normalizeText(text);

    console.log('📄 Texto extraído (primeros 800 chars):');
    console.log(normalized.substring(0, 800));
    console.log('\n' + '='.repeat(80) + '\n');

    // Intentar diferentes patrones para detectar unidades
    const patterns = [
        // Patrón 1: "Unidad 1: Titulo\nDescripcion"
        {
            name: 'Patrón 1: Unidad X: Titulo (multilínea)',
            regex: /Unidad\s+(\d+)\s*:\s*([^\n]+)\n\s*([^U]+?)(?=\nUnidad\s+\d+|$)/gi
        },
        // Patrón 2: "Unidad 1. Titulo\nDescripcion"
        {
            name: 'Patrón 2: Unidad X. Titulo (multilínea)',
            regex: /Unidad\s+(\d+)\s*\.\s*([^\n]+)\n\s*([^U]+?)(?=\nUnidad\s+\d+|$)/gi
        },
        // Patrón 3: "Unidad 1 - Titulo. Descripcion"
        {
            name: 'Patrón 3: Unidad X - Titulo. Descripcion',
            regex: /Unidad\s+(\d+)\s*[-:]\s*([^\.]+)\.\s*([^U]+?)(?=Unidad\s+\d+|$)/gi
        },
        // Patrón 4: "UNIDAD 1: Titulo\nDescripcion"
        {
            name: 'Patrón 4: UNIDAD X: Titulo (multilínea)',
            regex: /UNIDAD\s+(\d+)\s*:\s*([^\n]+)\n\s*([^U]+?)(?=\nUNIDAD\s+\d+|$)/gi
        },
        // Patrón 5: Más flexible - captura todo después de "Unidad X:"
        {
            name: 'Patrón 5: Unidad X: (muy flexible)',
            regex: /Unidad\s+(\d+)\s*:\s*([^\.]+?)\.\s+(.+?)(?=\s+Unidad\s+\d+|$)/gis
        }
    ];

    let units = [];
    let patternUsed = null;

    for (const pattern of patterns) {
        console.log(`🔍 Probando: ${pattern.name}`);
        const matches = [...normalized.matchAll(pattern.regex)];

        if (matches.length > 0) {
            console.log(`✅ ¡Coincidencia! Encontradas ${matches.length} unidades\n`);
            patternUsed = pattern.name;

            units = matches.map(match => {
                const unit = {
                    unit: parseInt(match[1]),
                    title: match[2].trim(),
                    description: match[3].trim().replace(/\s+/g, ' ')
                };

                console.log(`📌 Unidad ${unit.unit}`);
                console.log(`   Título: ${unit.title}`);
                console.log(`   Descripción (${unit.description.length} chars): ${unit.description.substring(0, 150)}...`);
                console.log('');

                return unit;
            });

            break;
        } else {
            console.log(`❌ Sin coincidencias\n`);
        }
    }

    if (units.length === 0) {
        console.warn('⚠️  No se encontraron unidades con ningún patrón.');
        console.log('\n📄 Mostrando más texto para análisis manual:\n');
        console.log(normalized.substring(0, 3000));
        console.log('\n... (texto truncado) ...\n');
    }

    return { units, patternUsed, rawText: normalized };
}

async function extractTextFromPDF(pdfPath) {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
    }

    return { text: fullText, numPages: pdf.numPages };
}

async function extractDescriptionsFromPDF(pdfPath, materia) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📚 Procesando: ${path.basename(pdfPath)}`);
    console.log(`🏷️  Materia: ${materia}`);
    console.log('='.repeat(80) + '\n');

    try {
        const { text, numPages } = await extractTextFromPDF(pdfPath);

        console.log(`✅ PDF cargado: ${numPages} páginas\n`);

        const result = parseUnitDescriptions(text);

        return {
            materia,
            units: result.units,
            patternUsed: result.patternUsed,
            pagesCount: numPages
        };

    } catch (error) {
        console.error(`❌ Error procesando ${pdfPath}:`, error.message);
        console.error(error.stack);
        return null;
    }
}

async function main() {
    console.log('🚀 Iniciando extracción de descripciones de unidades\n');

    const dir = './Descripcion_Unidades';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

    console.log(`📁 Directorio: ${dir}`);
    console.log(`📄 PDFs encontrados: ${files.length}\n`);

    const results = {};

    for (const file of files) {
        const match = file.match(/Descripcion_(.+)\.pdf/i);
        if (!match) continue;

        const materia = match[1];
        const pdfPath = path.join(dir, file);

        const result = await extractDescriptionsFromPDF(pdfPath, materia);

        if (result && result.units.length > 0) {
            results[materia] = result.units;
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(80) + '\n');

    for (const [materia, units] of Object.entries(results)) {
        console.log(`✅ ${materia}: ${units.length} unidades extraídas`);
    }

    if (Object.keys(results).length > 0) {
        const outputFile = './unit_descriptions.json';
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
        console.log(`\n💾 Archivo guardado: ${outputFile}`);

        console.log('\n📋 Vista previa del contenido:');
        for (const [materia, units] of Object.entries(results)) {
            console.log(`\n${materia}:`);
            units.forEach(u => {
                console.log(`  - Unidad ${u.unit}: ${u.title}`);
            });
        }
    } else {
        console.log('\n⚠️  No se extrajeron descripciones.');
    }
}

main().catch(console.error);
