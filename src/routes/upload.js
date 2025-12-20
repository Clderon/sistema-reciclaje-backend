const express = require('express');
const router = express.Router();
const { uploadImageFromBase64, getUserImageCount } = require('../controllers/uploadController');

// GET /api/upload/count/:userId - Contar imágenes del usuario
router.get('/count/:userId', getUserImageCount);

// POST /api/upload/image - Subir imagen a S3 (desde base64)
router.post('/image', uploadImageFromBase64);

module.exports = router;

