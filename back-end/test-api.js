// Script para probar las APIs del backend
const BASE_URL = 'http://localhost:3000';

async function testLogin() {
    console.log('🧪 Probando login...\n');

    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@cefimat.com',
                password: 'admin123'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login exitoso!');
            console.log('📝 Usuario:', data.user.email);
            console.log('👤 Rol:', data.user.role);
            console.log('🔑 Token:', data.token.substring(0, 20) + '...');
            return data.token;
        } else {
            console.error('❌ Error en login:', data);
            return null;
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        return null;
    }
}

async function testGetUnits(token) {
    console.log('\n🧪 Probando obtener unidades...\n');

    try {
        const response = await fetch(`${BASE_URL}/api/student/units`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Unidades obtenidas!');
            console.log(`📚 Total: ${data.units.length} unidades\n`);
            data.units.forEach((unit, index) => {
                console.log(`${index + 1}. ${unit.title}`);
                console.log(`   - Materia: ${unit.subject}`);
                console.log(`   - Key: ${unit.key}`);
            });
        } else {
            console.error('❌ Error obteniendo unidades:', data);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Iniciando pruebas del backend CEFIMAT\n');
    console.log('='.repeat(50));

    const token = await testLogin();

    if (token) {
        await testGetUnits(token);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Pruebas completadas!');
}

runTests();
