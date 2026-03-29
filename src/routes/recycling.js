const express = require('express');
const router = express.Router();
const { createRecycling, getUserRecyclingHistory } = require('../controllers/recyclingController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { recyclingSchema } = require('../middleware/schemas');

// POST /api/recycling — requiere token
router.post('/', authenticate, validate(recyclingSchema), createRecycling);

// GET /api/recycling/user/:userId — requiere token
router.get('/user/:userId', authenticate, getUserRecyclingHistory);

module.exports = router;
