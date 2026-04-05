// Test simple de la API
async function test() {
    console.log('Probando login...');

    const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@cefimat.com',
            password: 'admin123'
        })
    });

    const data = await res.json();
    console.log('\nRespuesta de login:');
    console.log(JSON.stringify(data, null, 2));

    if (data.token) {
        console.log('\n--- Token obtenido, probando /api/student/units ---\n');

        const res2 = await fetch('http://localhost:3000/api/student/units', {
            headers: { 'Authorization': `Bearer ${data.token}` }
        });

        const units = await res2.json();
        console.log('Respuesta de units:');
        console.log(JSON.stringify(units, null, 2));
    }
}

test().catch(console.error);
