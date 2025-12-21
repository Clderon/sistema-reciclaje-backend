/**
 * Sistema de configuración de entorno
 * - LOCAL: PostgreSQL en Docker (sin almacenamiento de imágenes)
 * - AWS: PostgreSQL en RDS + Cloudflare R2 para almacenamiento de imágenes
 */

require('dotenv').config();

const ENVIRONMENTS = {
  LOCAL: 'local',
  AWS: 'aws'
};

// Obtener el entorno actual desde variable de entorno
// Puede ser: 'local' o 'aws'
const currentEnvironment = process.env.ENVIRONMENT || ENVIRONMENTS.LOCAL;

/**
 * Obtener configuración de base de datos según el entorno
 */
function getDatabaseConfig() {
  const env = currentEnvironment.toLowerCase();

  if (env === ENVIRONMENTS.AWS) {
    // Configuración para PostgreSQL en la nube (Supabase, AWS RDS, etc.)
    if (process.env.DATABASE_URL) {
      // Detectar si es Supabase (la URL contiene supabase.co o pooler.supabase.com)
      const isSupabase = process.env.DATABASE_URL.includes('supabase.co') || 
                         process.env.DATABASE_URL.includes('pooler.supabase.com');
      
      // Para Supabase, necesitamos SSL con rejectUnauthorized: false
      // IMPORTANTE: Remover cualquier parámetro sslmode de la URL para que el objeto SSL tenga control
      let connectionString = process.env.DATABASE_URL;
      
      // Remover parámetros SSL de la URL (si existen) para que el objeto SSL tenga prioridad
      if (isSupabase) {
        connectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, '');
      }
      
      // Configuración SSL explícita - esto es lo que realmente importa para Supabase
      const sslConfig = isSupabase || process.env.DB_SSL === 'true' 
        ? { rejectUnauthorized: false } 
        : false;
      
      return {
        connectionString: connectionString,
        ssl: sslConfig,
        source: isSupabase ? 'Supabase (DATABASE_URL)' : 'DATABASE_URL (Cloud PostgreSQL)'
      };
    } else {
      // Fallback a variables individuales
      return {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        source: 'env_vars (Cloud PostgreSQL)'
      };
    }
  } else {
    // Configuración para LOCAL (PostgreSQL en Docker)
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'SelvaGO',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: false,
      source: 'local (Docker)'
    };
  }
}

/**
 * Obtener configuración de almacenamiento según el entorno
 */
function getS3Config() {
  const env = currentEnvironment.toLowerCase();

  if (env === ENVIRONMENTS.AWS) {
    // Configuración para Cloudflare R2 (almacenamiento en la nube)
    return {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: process.env.R2_REGION || 'auto',
      bucketName: process.env.R2_BUCKET_NAME,
      endpoint: process.env.R2_ENDPOINT,
      s3ForcePathStyle: true, // R2 siempre requiere path-style
      enabled: true,
      source: 'Cloudflare R2'
    };
  } else {
    // Modo LOCAL - Sin almacenamiento de imágenes
    // Para usar almacenamiento, cambiar a ENVIRONMENT=aws y configurar Cloudflare R2
    return {
      enabled: false,
      source: 'local (deshabilitado - usar ENVIRONMENT=aws para R2)'
    };
  }
}

/**
 * Obtener información del entorno actual
 */
function getEnvironmentInfo() {
  return {
    current: currentEnvironment,
    database: getDatabaseConfig(),
    s3: getS3Config()
  };
}

module.exports = {
  ENVIRONMENTS,
  currentEnvironment,
  getDatabaseConfig,
  getS3Config,
  getEnvironmentInfo
};

