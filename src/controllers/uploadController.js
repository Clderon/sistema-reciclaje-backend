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
    const { image, fileName, userId } = req.body;

    if (!image) {
      return res.status(400).json({
        error: 'Imagen requerida',
        message: 'Se requiere el campo "image" en base64'
      });
    }

    // Validar que sea una imagen en base64 (solo formatos permitidos)
    const base64Regex = /^data:image\/(png|jpeg|jpg|webp);base64,/;
    if (!base64Regex.test(image)) {
      return res.status(400).json({
        error: 'Formato inválido',
        message: 'Solo se permiten imágenes en formato JPEG, PNG o WEBP'
      });
    }

    // Extraer el tipo MIME y los datos base64
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        error: 'Formato de imagen inválido'
      });
    }

    const contentType = `image/${matches[1]}`;
    const base64Data = matches[2];

    // Convertir base64 a buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

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
    const finalFileName = fileName || `evidencia-${Date.now()}.${matches[1]}`;

    // Subir a S3
    const imageUrl = await uploadImage(imageBuffer, finalFileName, contentType);

    res.json({
      success: true,
      imageUrl,
      message: 'Imagen subida exitosamente'
    });

  } catch (error) {
    console.error('Error en uploadImageFromBase64:', error);
    res.status(500).json({
      error: 'Error al subir imagen',
      message: error.message
    });
  }
}

module.exports = {
  uploadImageFromBase64,
  getUserImageCount,
};

