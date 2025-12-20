const express = require('express');
const router = express.Router();
const { uploadImageFromBase64 } = require('../controllers/uploadController');

// POST /api/upload/image - Subir imagen a S3 (desde base64)
router.post('/image', uploadImageFromBase64);

module.exports = router;

