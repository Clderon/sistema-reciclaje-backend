// Script simple para probar conexión a RDS
// Ejecutar: node test-connection.js

require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  let pool;

  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } else {
    const sslConfig = process.env.DB_SSL === 'true' 
      ? { rejectUnauthorized: false }
      : false;
      
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: sslConfig
    });
  }

  try {
    console.log('🔄 Intentando conectar a RDS...');
    console.log('Host:', process.env.DB_HOST || 'N/A');
    console.log('Database:', process.env.DB_NAME || 'N/A');
    console.log('User:', process.env.DB_USER || 'N/A');
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    
    console.log('✅ Conexión exitosa!');
    console.log('Fecha/Hora del servidor:', result.rows[0].now);
    console.log('Versión PostgreSQL:', result.rows[0].version.split(',')[0]);
    
    // Listar bases de datos disponibles
    const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('\n📁 Bases de datos disponibles:');
    dbResult.rows.forEach(row => {
      console.log('  -', row.datname);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Test completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error('Mensaje:', error.message);
    console.error('\n💡 Verifica:');
    console.error('  1. Que el archivo .env existe y tiene los datos correctos');
    console.error('  2. Que la contraseña es correcta');
    console.error('  3. Que el Security Group de RDS permite conexiones desde tu IP');
    console.error('  4. Que el nombre de la base de datos existe');
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

