const { Pool } = require('pg');
const { getDatabaseConfig } = require('./environment');
const { URL } = require('url');

// Obtener configuración según el entorno (local o aws)
const dbConfig = getDatabaseConfig();

// Crear pool de conexiones
let pool;
if (dbConfig.connectionString) {
  // Para Supabase (pooler), necesitamos forzar IPv4 porque Render no soporta IPv6
  const isSupabasePooler = dbConfig.connectionString.includes('pooler.supabase.com');
  
  if (isSupabasePooler) {
    // Parsear la URL para poder especificar family: 4 (IPv4)
    const parsedUrl = new URL(dbConfig.connectionString);
    const poolConfig = {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port, 10),
      database: parsedUrl.pathname.substring(1), // Remover el '/' inicial
      user: parsedUrl.username,
      password: parsedUrl.password,
      family: 4, // Forzar IPv4 (Render no soporta IPv6)
      ssl: dbConfig.ssl // Ya está configurado en environment.js (rejectUnauthorized: false para Supabase)
    };
    
    pool = new Pool(poolConfig);
  } else {
    // Para otras conexiones, usar connectionString normalmente
    const poolConfig = {
      connectionString: dbConfig.connectionString
    };
    
    // Siempre agregar SSL si está configurado (necesario para Supabase)
    if (dbConfig.ssl) {
      poolConfig.ssl = dbConfig.ssl;
    }
    
    pool = new Pool(poolConfig);
  }
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

