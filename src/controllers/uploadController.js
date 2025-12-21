const { uploadImage } = require('../config/s3');
const { query } = require('../config/database');

// Límites de validación
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const MIN_IMAGE_SIZE = 10 * 1024; // 10 KB (opcional)
const MAX_IMAGES_PER_USER = 5; // Máximo 5 imágenes por usuario

/**
 * Contar imágenes del usuario (reciclajes con imagen)
 * GET /api/upload/count/:userId
 */
async function getUserImageCount(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Usuario requerido',
        message: 'Se requiere userId'
      });
    }

    const result = await query(
      `SELECT COUNT(*) as count 
       FROM recycling_records 
       WHERE user_id = $1 AND evidence_image_url IS NOT NULL`,
      [userId]
    );

    const count = parseInt(result.rows[0].count);

    res.json({
      count,
      maxAllowed: MAX_IMAGES_PER_USER,
      canUpload: count < MAX_IMAGES_PER_USER
    });

  } catch (error) {
    console.error('Error en getUserImageCount:', error);
    res.status(500).json({
      error: 'Error al contar imágenes',
      message: error.message
    });
  }
}

/**
 * Subir imagen a S3 desde base64
 * POST /api/upload/image
 * Body: { image: "data:image/jpeg;base64,...", fileName: "evidencia.jpg", userId: 1 }
 */
async function uploadImageFromBase64(req, res) {
  try {
    console.log('📥 Recibida petición de subida de imagen');
    const { image, fileName, userId } = req.body;

    if (!image) {
      console.error('❌ No se proporcionó imagen');
      return res.status(400).json({
        error: 'Imagen requerida',
        message: 'Se requiere el campo "image" en base64'
      });
    }

    console.log('📊 Datos recibidos:', {
      hasImage: !!image,
      imageLength: image ? image.length : 0,
      fileName: fileName || 'no proporcionado',
      userId: userId || 'no proporcionado',
    });

    // Validar y extraer el tipo MIME y los datos base64
    let matches;
    let contentType;
    let base64Data;

    // Intentar diferentes formatos de base64
    if (image.startsWith('data:image/')) {
      matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({
          error: 'Formato de imagen inválido',
          message: 'El formato base64 debe ser: data:image/[tipo];base64,[datos]'
        });
      }
      const imageType = matches[1].toLowerCase();
      
      // Validar que sea un formato permitido
      const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
      if (!allowedTypes.includes(imageType)) {
        return res.status(400).json({
          error: 'Formato inválido',
          message: 'Solo se permiten imágenes en formato JPEG, PNG o WEBP'
        });
      }
      
      // Normalizar jpg a jpeg para contentType
      contentType = imageType === 'jpg' ? 'image/jpeg' : `image/${imageType}`;
      base64Data = matches[2];
    } else {
      // Si no tiene el prefijo data:, asumir que es solo base64 (compatibilidad)
      // Intentar detectar el tipo por los primeros bytes
      try {
        base64Data = image;
        const buffer = Buffer.from(base64Data, 'base64');
        const header = buffer.toString('hex', 0, 4);
        
        if (header.startsWith('ffd8')) {
          contentType = 'image/jpeg';
        } else if (header.startsWith('89504e47')) {
          contentType = 'image/png';
        } else if (header.startsWith('52494646')) {
          // RIFX/RIFF - podría ser WEBP
          contentType = 'image/webp';
        } else {
          return res.status(400).json({
            error: 'Formato de imagen no reconocido',
            message: 'No se pudo detectar el formato de la imagen'
          });
        }
      } catch (err) {
        return res.status(400).json({
          error: 'Formato de imagen inválido',
          message: 'Los datos no son válidos en base64'
        });
      }
    }

    // Convertir base64 a buffer
    let imageBuffer;
    try {
      imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Validar que el buffer no esté vacío
      if (!imageBuffer || imageBuffer.length === 0) {
        return res.status(400).json({
          error: 'Imagen vacía',
          message: 'Los datos de la imagen están vacíos'
        });
      }
    } catch (err) {
      return res.status(400).json({
        error: 'Error al procesar imagen',
        message: 'No se pudo convertir los datos base64 a imagen: ' + err.message
      });
    }

    // Validar tamaño mínimo
    if (imageBuffer.length < MIN_IMAGE_SIZE) {
      return res.status(400).json({
        error: 'Imagen muy pequeña',
        message: `La imagen debe tener al menos ${MIN_IMAGE_SIZE / 1024} KB`
      });
    }

    // Validar tamaño máximo (15MB)
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
      return res.status(400).json({
        error: 'Imagen muy grande',
        message: `La imagen no debe exceder ${maxSizeMB} MB`
      });
    }

    // Validar límite de imágenes por usuario (si se proporciona userId)
    if (userId) {
      const countResult = await query(
        `SELECT COUNT(*) as count 
         FROM recycling_records 
         WHERE user_id = $1 AND evidence_image_url IS NOT NULL`,
        [userId]
      );

      const currentCount = parseInt(countResult.rows[0].count);
      if (currentCount >= MAX_IMAGES_PER_USER) {
        return res.status(403).json({
          error: 'Límite de imágenes alcanzado',
          message: `Has alcanzado el límite de ${MAX_IMAGES_PER_USER} imágenes. Elimina algunas imágenes antes de subir nuevas.`
        });
      }
    }

    // Generar nombre de archivo si no se proporciona
    const extension = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1];
    const finalFileName = fileName || `evidencia-${Date.now()}.${extension}`;

    // Subir a S3
    const imageUrl = await uploadImage(imageBuffer, finalFileName, contentType);

    res.json({
      success: true,
      imageUrl,
      message: 'Imagen subida exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en uploadImageFromBase64:', error);
    console.error('Stack:', error.stack);
    
    // Proporcionar mensaje de error más descriptivo
    let errorMessage = error.message || 'Error desconocido al subir imagen';
    
    // Si es un error de AWS, proporcionar más detalles
    if (error.code) {
      errorMessage = `Error de AWS (${error.code}): ${error.message}`;
    }
    
    res.status(500).json({
      error: 'Error al subir imagen',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}

module.exports = {
  uploadImageFromBase64,
  getUserImageCount,
};

