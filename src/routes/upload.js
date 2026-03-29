const express = require('express');
const router = express.Router();
const { uploadImageFromBase64, getUserImageCount } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadImageSchema } = require('../middleware/schemas');

// GET /api/upload/count/:userId — requiere token
router.get('/count/:userId', authenticate, getUserImageCount);

// POST /api/upload/image — requiere token
router.post('/image', authenticate, validate(uploadImageSchema), uploadImageFromBase64);

module.exports = router;
