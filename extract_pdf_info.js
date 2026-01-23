const fs = require('fs');
const path = require('path');

// Simulación de extracción de PDF - necesitarías instalar pdf-parse
// npm install pdf-parse

console.log('🔍 Buscando archivos PDF en Descripcion_Unidades/...\n');

const dir = './Descripcion_Unidades';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

console.log(`📄 Archivos encontrados: ${files.length}\n`);
files.forEach(file => {
    console.log(`  - ${file}`);
    
    // Extraer nombre de materia del nombre del archivo
    // Formato: Descripcion_Materia.pdf
    const match = file.match(/Descripcion_(.+)\.pdf/i);
    if (match) {
        const materia = match[1].replace(/_/g, ' ');
        console.log(`    Materia: ${materia}`);
    }
});

console.log('\n✅ Para extraer el contenido, necesitas:');
console.log('1. Instalar pdf-parse: npm install pdf-parse');
console.log('2. O usar la herramienta extract_descriptions.html en el navegador');
console.log('3. O proporcionar las descripciones manualmente en formato JSON');

// Estructura esperada
const example = {
    "Historia_De_Mexico": [
        {
            "unit": 1,
            "title": "México Prehispánico",
            "description": "Estudio de las civilizaciones que habitaron el territorio mexicano antes de la llegada de los españoles..."
        },
        {
            "unit": 2,
            "title": "La Conquista",
            "description": "Análisis del proceso de conquista española del territorio mesoamericano..."
        }
    ]
};

console.log('\n📋 Estructura JSON esperada:');
console.log(JSON.stringify(example, null, 2));
