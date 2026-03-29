// Forzar IPv4 para todas las resoluciones DNS (Render no soporta IPv6)
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { Pool } = require('pg');
const { getDatabaseConfig } = require('./environment');
const { URL } = require('url');
const logger = require('./logger');

// Obtener configuración según el entorno (local o aws)
const dbConfig = getDatabaseConfig();

// Crear pool de conexiones
let pool;
if (dbConfig.connectionString) {
  // Para Supabase (pooler), necesitamos forzar IPv4 porque Render no soporta IPv6
  const isSupabasePooler = dbConfig.connectionString.includes('pooler.supabase.com');
  
  if (isSupabasePooler) {
    logger.info('Detectado pooler de Supabase — configurando IPv4 forzado (family: 4)');

    const parsedUrl = new URL(dbConfig.connectionString);
    const pathParts = parsedUrl.pathname.split('/').filter(p => p);
    const database = pathParts[pathParts.length - 1] || 'postgres';

    const poolConfig = {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port, 10) || 6543,
      database: database,
      user: parsedUrl.username || 'postgres',
      password: parsedUrl.password,
      family: 4,
      ssl: dbConfig.ssl || { rejectUnauthorized: false }
    };

    logger.info({ host: `${poolConfig.host}:${poolConfig.port}`, database: poolConfig.database, user: poolConfig.user }, 'Conexión Supabase pooler');
    
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
    logger.info(
      {
        source: dbConfig.source,
        database: result.rows[0].current_database,
        user: result.rows[0].current_user,
        serverTime: result.rows[0].now,
      },
      'Conexión exitosa a PostgreSQL'
    );
    client.release();
    return true;
  } catch (error) {
    logger.error({ source: dbConfig.source, err: error.message }, 'Error conectando a PostgreSQL');
    throw error;
  }
}

// Función para ejecutar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ query: text.substring(0, 100), duration_ms: duration, rows: res.rowCount }, 'Query ejecutada');
    return res;
  } catch (error) {
    logger.error({ query: text.substring(0, 100), err: error.message }, 'Error en query');
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

