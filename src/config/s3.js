const AWS = require('aws-sdk');
const { getS3Config } = require('./environment');

// Obtener configuración según el entorno (local o aws)
const s3Config = getS3Config();

// Configurar AWS S3 o MinIO solo si está habilitado
let s3 = null;
let BUCKET_NAME = null;

if (s3Config.enabled) {
  const s3Options = {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
    region: s3Config.region,
  };

  // Si hay endpoint personalizado (MinIO), agregarlo
  if (s3Config.endpoint) {
    s3Options.endpoint = s3Config.endpoint;
    s3Options.s3ForcePathStyle = s3Config.s3ForcePathStyle || false;
    // MinIO no requiere firma de versión 4
    s3Options.signatureVersion = 'v4';
  }

  s3 = new AWS.S3(s3Options);
  BUCKET_NAME = s3Config.bucketName;
}

/**
 * Subir imagen a S3 y generar URL temporal firmada
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {String} fileName - Nombre del archivo (con extensión)
 * @param {String} contentType - Tipo MIME (ej: 'image/jpeg', 'image/png')
 * @returns {Promise<String>} URL temporal firmada (presigned URL) válida por 7 días
 */
async function uploadImage(imageBuffer, fileName, contentType = 'image/jpeg') {
  if (!s3Config.enabled) {
    throw new Error('Almacenamiento no está habilitado. Configura USE_MINIO=true para usar MinIO en local o ENVIRONMENT=aws para usar S3.');
  }

  try {
    // Asegurar que el bucket existe (especialmente importante para MinIO)
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

    // Subir imagen a S3/MinIO
    const result = await s3.upload(params).promise();
    
    // Generar URL temporal firmada (válida por 7 días = 604800 segundos)
    const presignedUrl = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: 7 * 24 * 60 * 60, // 7 días en segundos
    });
    
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
 * Eliminar imagen de S3
 * @param {String} imageUrl - URL completa de la imagen en S3
 * @returns {Promise<void>}
 */
async function deleteImage(imageUrl) {
  if (!s3Config.enabled) {
    console.log('ℹ️  Almacenamiento deshabilitado. No se puede eliminar la imagen.');
    return;
  }

  try {
    // Extraer la key del URL
    // Para MinIO: http://localhost:9000/bucket/key
    // Para AWS S3: https://bucket.s3.amazonaws.com/key o https://s3.amazonaws.com/bucket/key
    let key;
    
    if (s3Config.endpoint) {
      // MinIO - formato: http://localhost:9000/bucket/key
      const url = new URL(imageUrl);
      key = url.pathname.substring(1); // Remover el primer /
      if (key.startsWith(BUCKET_NAME + '/')) {
        key = key.substring(BUCKET_NAME.length + 1);
      }
    } else {
      // AWS S3
      const urlParts = imageUrl.split('.com/');
      if (urlParts.length < 2) {
        // Intentar otro formato: s3.amazonaws.com/bucket/key
        const s3Parts = imageUrl.split('amazonaws.com/');
        if (s3Parts.length >= 2) {
          key = s3Parts[1].substring(BUCKET_NAME.length + 1);
        } else {
          throw new Error('URL de almacenamiento inválida');
        }
      } else {
        key = urlParts[1];
      }
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
 * Verificar conexión a S3
 * @returns {Promise<Boolean>}
 */
async function testConnection() {
  if (!s3Config.enabled) {
    console.log(`ℹ️  Almacenamiento deshabilitado [${s3Config.source}].`);
    return false;
  }

  try {
    if (!BUCKET_NAME) {
      throw new Error(`Bucket name no está configurado (${s3Config.source === 'AWS S3' ? 'S3_BUCKET_NAME' : 'MINIO_BUCKET_NAME'})`);
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
    console.error(`❌ Error conectando a ${s3Config.source}:`, error.message);
    if (error.code === 'NotFound' || error.statusCode === 404) {
      throw new Error(`El bucket "${BUCKET_NAME}" no existe. Asegúrate de crearlo primero.`);
    } else if (error.code === 'Forbidden' || error.statusCode === 403) {
      throw new Error(`Acceso denegado al bucket "${BUCKET_NAME}". Verifica tus credenciales`);
    } else if (error.code === 'CredentialsError' || error.code === 'InvalidAccessKeyId') {
      const credKey = s3Config.source === 'AWS S3' ? 'AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY' : 'MINIO_ACCESS_KEY/MINIO_SECRET_KEY';
      throw new Error(`Credenciales inválidas. Verifica ${credKey}`);
    } else if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      throw new Error(`No se puede conectar a ${s3Config.endpoint || 'S3'}. Verifica que MinIO esté corriendo en local.`);
    }
    throw error;
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  testConnection,
  ensureBucketExists,
  s3,
  BUCKET_NAME,
};

