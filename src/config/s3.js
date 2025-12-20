const AWS = require('aws-sdk');
require('dotenv').config();

// Configurar AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Subir imagen a S3 y generar URL temporal firmada
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {String} fileName - Nombre del archivo (con extensión)
 * @param {String} contentType - Tipo MIME (ej: 'image/jpeg', 'image/png')
 * @returns {Promise<String>} URL temporal firmada (presigned URL) válida por 7 días
 */
async function uploadImage(imageBuffer, fileName, contentType = 'image/jpeg') {
  try {
    // Generar nombre único para el archivo
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const key = `recycling-evidence/${uniqueFileName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
    };

    // Subir imagen a S3
    const result = await s3.upload(params).promise();
    console.log('✅ Imagen subida a S3:', key);
    
    // Generar URL temporal firmada (válida por 7 días = 604800 segundos)
    const presignedUrl = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: 7 * 24 * 60 * 60, // 7 días en segundos
    });
    
    console.log('✅ URL temporal generada (válida 7 días)');
    return presignedUrl;
  } catch (error) {
    console.error('❌ Error subiendo imagen a S3:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
}

/**
 * Eliminar imagen de S3
 * @param {String} imageUrl - URL completa de la imagen en S3
 * @returns {Promise<void>}
 */
async function deleteImage(imageUrl) {
  try {
    // Extraer la key del URL
    const urlParts = imageUrl.split('.com/');
    if (urlParts.length < 2) {
      throw new Error('URL de S3 inválida');
    }
    
    const key = urlParts[1];
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    console.log('✅ Imagen eliminada de S3:', key);
  } catch (error) {
    console.error('❌ Error eliminando imagen de S3:', error);
    throw new Error(`Error al eliminar imagen: ${error.message}`);
  }
}

/**
 * Verificar conexión a S3
 * @returns {Promise<Boolean>}
 */
async function testConnection() {
  try {
    if (!BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME no está configurado');
    }

    const params = {
      Bucket: BUCKET_NAME,
    };

    await s3.headBucket(params).promise();
    console.log('✅ Conexión a S3 exitosa. Bucket:', BUCKET_NAME);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a S3:', error.message);
    if (error.code === 'NotFound') {
      throw new Error(`El bucket "${BUCKET_NAME}" no existe`);
    } else if (error.code === 'Forbidden') {
      throw new Error(`Acceso denegado al bucket "${BUCKET_NAME}". Verifica tus credenciales`);
    } else if (error.code === 'CredentialsError') {
      throw new Error('Credenciales de AWS inválidas. Verifica AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY');
    }
    throw error;
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  testConnection,
  s3,
  BUCKET_NAME,
};

