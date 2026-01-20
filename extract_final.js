const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

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
    
    console.log('📄 Texto extraído (primeros 1000 chars):');
    console.log(normalized.substring(0, 1000));
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Patrón específico para el formato: "Unidad X: Titulo. Descripcion."
    const pattern = /Unidad\s+(\d+)\s*:\s*([^\.]+)\.\s*([^\.]+(?:\.[^U]+?)?)\s*(?=Unidad\s+\d+|$)/gi;
    
    console.log('🔍 Usando patrón: Unidad X: Titulo. Descripcion.');
    const matches = [...normalized.matchAll(pattern)];
    
    let units = [];
    
    if (matches.length > 0) {
        console.log(`✅ ¡Coincidencia! Encontradas ${matches.length} unidades\n`);
        
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
    } else {
        console.log(`❌ Sin coincidencias\n`);
        console.warn('⚠️  No se encontraron unidades con el patrón.');
        console.log('\n📄 Mostrando más texto para análisis manual:\n');
        console.log(normalized.substring(0, 3000));
        console.log('\n... (texto truncado) ...\n');
    }

    return { units, patternUsed: 'Unidad X: Titulo. Descripcion.', rawText: normalized };
}

async function extractDescriptionsFromPDF(pdfPath, materia) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📚 Procesando: ${path.basename(pdfPath)}`);
    console.log(`🏷️  Materia: ${materia}`);
    console.log('='.repeat(80) + '\n');

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const uint8Array = new Uint8Array(dataBuffer);
        const parser = new PDFParse(uint8Array);
        const result = await parser.getText();
        
        console.log(`✅ PDF cargado: ${result.pages || 'N/A'} páginas\n`);
        
        const parsed = parseUnitDescriptions(result.text);
        
        return {
            materia,
            units: parsed.units,
            patternUsed: parsed.patternUsed,
            pagesCount: result.pages || 0
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
