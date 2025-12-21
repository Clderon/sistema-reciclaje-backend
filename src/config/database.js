const { Pool } = require('pg');
const { getDatabaseConfig } = require('./environment');

// Obtener configuración según el entorno (local o aws)
const dbConfig = getDatabaseConfig();

// Crear pool de conexiones
let pool;
if (dbConfig.connectionString) {
  // Configuración para conexión con connectionString (Supabase, etc.)
  // Si es Supabase o requiere SSL, siempre agregar la configuración SSL explícitamente
  const poolConfig = {
    connectionString: dbConfig.connectionString
  };
  
  // Siempre agregar SSL si está configurado (necesario para Supabase)
  if (dbConfig.ssl) {
    poolConfig.ssl = dbConfig.ssl;
  }
  
  pool = new Pool(poolConfig);
} else {
  // Configuración para conexión con variables individuales
  pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl || false
  });
}

// Función para probar conexión (lanza error si falla)
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), current_database(), current_user');
    console.log(`✅ Conexión exitosa a PostgreSQL [${dbConfig.source}]:`);
    console.log(`   📊 Base de datos: ${result.rows[0].current_database}`);
    console.log(`   👤 Usuario: ${result.rows[0].current_user}`);
    console.log(`   ⏰ Hora del servidor: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error(`❌ Error conectando a PostgreSQL [${dbConfig.source}]:`, error.message);
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

