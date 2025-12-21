/**
 * Sistema de configuración de entorno
 * Permite cambiar fácilmente entre entorno LOCAL (Docker) y AWS (RDS + S3)
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
    // Configuración para AWS RDS
    if (process.env.DATABASE_URL) {
      return {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        source: 'DATABASE_URL (AWS RDS)'
      };
    } else {
      // Fallback a variables individuales para AWS
      return {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        source: 'env_vars (AWS RDS)'
      };
    }
  } else {
    // Configuración para LOCAL (Docker PostgreSQL)
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
 * Obtener configuración de S3 según el entorno
 */
function getS3Config() {
  const env = currentEnvironment.toLowerCase();

  if (env === ENVIRONMENTS.AWS) {
    // Configuración para AWS S3
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucketName: process.env.S3_BUCKET_NAME,
      endpoint: undefined, // AWS S3 usa el endpoint por defecto
      s3ForcePathStyle: false,
      enabled: true,
      source: 'AWS S3'
    };
  } else {
    // Configuración para LOCAL (MinIO como alternativa a S3)
    const useMinIO = process.env.USE_MINIO !== 'false'; // Por defecto usar MinIO
    
    if (useMinIO) {
      return {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        region: 'us-east-1', // MinIO requiere región pero la ignora
        bucketName: process.env.MINIO_BUCKET_NAME || 'selvago',
        endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
        s3ForcePathStyle: true, // MinIO requiere path-style
        enabled: true,
        source: 'MinIO (local)'
      };
    } else {
      return {
        enabled: false,
        source: 'local (deshabilitado)'
      };
    }
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

