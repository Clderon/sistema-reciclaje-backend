const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión
let pool;

if (process.env.DATABASE_URL) {
  // Render, Railway o RDS proporcionan DATABASE_URL directamente
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // RDS generalmente requiere SSL, Render también
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
} else {
  // Configuración manual (para RDS o local)
  const sslConfig = process.env.DB_SSL === 'true' 
    ? { rejectUnauthorized: false }  // Para RDS
    : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false);
    
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sistema_reciclaje',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: sslConfig
  });
}

// Función para probar conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a PostgreSQL:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    throw error;
  }
}

// Función para ejecutar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Solo loggear queries en desarrollo para no llenar logs en producción
    if (process.env.NODE_ENV === 'development') {
      console.log('Query ejecutada', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

// Función para obtener cliente para transacciones
async function getClient() {
  const client = await pool.connect();
  return client;
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};

