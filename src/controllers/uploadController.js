const { uploadImage } = require('../config/s3');

/**
 * Subir imagen a S3 desde base64
 * POST /api/upload/image
 * Body: { image: "data:image/jpeg;base64,...", fileName: "evidencia.jpg" }
 */
async function uploadImageFromBase64(req, res) {
  try {
    const { image, fileName } = req.body;

    if (!image) {
      return res.status(400).json({
        error: 'Imagen requerida',
        message: 'Se requiere el campo "image" en base64'
      });
    }

    // Validar que sea una imagen en base64
    const base64Regex = /^data:image\/(png|jpeg|jpg|webp);base64,/;
    if (!base64Regex.test(image)) {
      return res.status(400).json({
        error: 'Formato inválido',
        message: 'La imagen debe estar en formato base64 (data:image/...;base64,...)'
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

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.length > maxSize) {
      return res.status(400).json({
        error: 'Imagen muy grande',
        message: 'La imagen no debe exceder 5MB'
      });
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
};

