const AWS = require('aws-sdk');
const { getS3Config } = require('./environment');

// Obtener configuración según el entorno (local o aws)
const s3Config = getS3Config();

// Configurar Cloudflare R2 solo si está habilitado
let s3 = null;
let BUCKET_NAME = null;

if (s3Config.enabled) {
  const s3Options = {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
    region: s3Config.region,
  };

  // Cloudflare R2 requiere endpoint y path-style
  if (s3Config.endpoint) {
    s3Options.endpoint = s3Config.endpoint;
    s3Options.s3ForcePathStyle = true;
    s3Options.signatureVersion = 'v4';
  }

  s3 = new AWS.S3(s3Options);
  BUCKET_NAME = s3Config.bucketName;
}

/**
 * Subir imagen a Cloudflare R2 y generar URL temporal firmada
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {String} fileName - Nombre del archivo (con extensión)
 * @param {String} contentType - Tipo MIME (ej: 'image/jpeg', 'image/png')
 * @returns {Promise<String>} URL temporal firmada (presigned URL) válida por 7 días
 */
async function uploadImage(imageBuffer, fileName, contentType = 'image/jpeg') {
  if (!s3Config.enabled) {
    throw new Error('Almacenamiento no está habilitado. Configura ENVIRONMENT=aws para usar Cloudflare R2.');
  }

  try {
    // Asegurar que el bucket existe
    await ensureBucketExists();

    // Generar nombre único para el archivo
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const key = `recycling-evidence/${uniqueFileName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
    };

    // Subir imagen a R2
    await s3.upload(params).promise();
    
    // Generar URL temporal firmada (válida por 7 días = 604800 segundos)
    let presignedUrl = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: 7 * 24 * 60 * 60, // 7 días en segundos
    });
    
    // Cloudflare R2: Las URLs presigned ya incluyen el endpoint correcto
    // R2 es accesible desde cualquier dispositivo (móvil, emulador, etc.)
    console.log(`✅ URL presigned generada para Cloudflare R2`);
    
    console.log(`🔗 Imagen ${s3Config.source}:`, presignedUrl);
    return presignedUrl;
  } catch (error) {
    console.error(`❌ Error subiendo imagen a ${s3Config.source}:`, error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
}

/**
 * Asegurar que el bucket existe (crear si no existe)
 */
async function ensureBucketExists() {
  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (error) {
    if (error.statusCode === 404 || error.code === 'NotFound') {
      // Bucket no existe, crearlo
      try {
        await s3.createBucket({ Bucket: BUCKET_NAME }).promise();
        console.log(`✅ Bucket "${BUCKET_NAME}" creado exitosamente`);
      } catch (createError) {
        // Si es AWS y el error es que el bucket ya existe en otra región, ignorar
        if (createError.code !== 'BucketAlreadyExists' && createError.code !== 'BucketAlreadyOwnedByYou') {
          throw createError;
        }
      }
    } else {
      throw error;
    }
  }
}

/**
 * Eliminar imagen de Cloudflare R2
 * @param {String} imageUrl - URL completa de la imagen en S3
 * @returns {Promise<void>}
 */
async function deleteImage(imageUrl) {
  if (!s3Config.enabled) {
    console.log('ℹ️  Almacenamiento deshabilitado. No se puede eliminar la imagen.');
    return;
  }

  try {
    // Extraer la key del URL de R2
    // Formato: https://[account-id].r2.cloudflarestorage.com/bucket/key
    const url = new URL(imageUrl);
    let key = url.pathname.substring(1); // Remover el primer /
    
    if (key.startsWith(BUCKET_NAME + '/')) {
      key = key.substring(BUCKET_NAME.length + 1);
    }
    
    // Remover query params si existen (presigned URLs)
    if (key.includes('?')) {
      key = key.split('?')[0];
    }
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    console.log(`✅ Imagen eliminada de ${s3Config.source}:`, key);
  } catch (error) {
    console.error(`❌ Error eliminando imagen de ${s3Config.source}:`, error);
    throw new Error(`Error al eliminar imagen: ${error.message}`);
  }
}

/**
 * Verificar conexión a Cloudflare R2
 * @returns {Promise<Boolean>}
 */
async function testConnection() {
  if (!s3Config.enabled) {
    console.log(`ℹ️  Almacenamiento deshabilitado [${s3Config.source}].`);
    return false;
  }

  try {
    if (!BUCKET_NAME) {
      throw new Error('Bucket name no está configurado (R2_BUCKET_NAME)');
    }

    // Asegurar que el bucket existe
    await ensureBucketExists();

    const params = {
      Bucket: BUCKET_NAME,
    };

    await s3.headBucket(params).promise();
    console.log(`✅ Conexión a ${s3Config.source} exitosa:`);
    console.log(`   🪣 Bucket: ${BUCKET_NAME}`);
    if (s3Config.endpoint) {
      console.log(`   🔗 Endpoint: ${s3Config.endpoint}`);
    } else {
      console.log(`   🌍 Región: ${s3Config.region}`);
    }
    return true;
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || 'Error desconocido';
    console.error(`❌ Error conectando a ${s3Config.source}:`, errorMessage);
    
    if (error.code === 'NotFound' || error.statusCode === 404) {
      throw new Error(`El bucket "${BUCKET_NAME}" no existe. Asegúrate de crearlo primero en Cloudflare R2.`);
    } else if (error.code === 'Forbidden' || error.statusCode === 403) {
      throw new Error(`Acceso denegado al bucket "${BUCKET_NAME}". Verifica tus credenciales (R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY)`);
    } else if (error.code === 'CredentialsError' || error.code === 'InvalidAccessKeyId') {
      throw new Error(`Credenciales inválidas. Verifica R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY`);
    }
    throw error;
  }
}

/**
 * Regenera una URL presignada fresca (7 días) a partir de una URL almacenada.
 * Resuelve el problema de URLs vencidas guardadas en la base de datos.
 *
 * @param {String} storedUrl - URL presignada vencida o key directa
 * @returns {String} URL presignada nueva, o la URL original si R2 no está habilitado
 */
function refreshPresignedUrl(storedUrl) {
  if (!s3Config.enabled || !s3 || !storedUrl) return storedUrl;

  try {
    // Extraer el key del objeto desde la URL almacenada
    // Formato R2 path-style: https://[account].r2.cloudflarestorage.com/[bucket]/[key]?...
    const url = new URL(storedUrl);
    const parts = url.pathname.split('/').filter(p => p);

    // Si el primer segmento es el bucket, el key son los segmentos restantes
    const key = parts[0] === BUCKET_NAME
      ? parts.slice(1).join('/')
      : parts.join('/');

    if (!key) return storedUrl;

    return s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: 7 * 24 * 60 * 60, // 7 días
    });
  } catch {
    // Si no se puede parsear la URL (ej: formato desconocido), devolver tal cual
    return storedUrl;
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  testConnection,
  ensureBucketExists,
  refreshPresignedUrl,
  s3,
  BUCKET_NAME,
};

