const { Client } = require('pg');

async function testConnection() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🔄 Intentando conectar a Supabase...');
        await client.connect();
        console.log('✅ Conexión exitosa!');

        const res = await client.query('SELECT NOW()');
        console.log('⏰ Timestamp del servidor:', res.rows[0]);

        await client.end();
        console.log('✅ Test completado');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
        console.error('Detalles:', err);
        process.exit(1);
    }
}

testConnection();
