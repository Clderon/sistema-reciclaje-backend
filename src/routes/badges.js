const express = require('express');
const router = express.Router();
const { getAllBadges, getUserBadges } = require('../controllers/badgeController');
const { authenticate } = require('../middleware/auth');

// GET /api/badges — público (cualquiera puede ver los badges disponibles)
router.get('/', getAllBadges);

// GET /api/badges/user/:userId — requiere token
router.get('/user/:userId', authenticate, getUserBadges);

module.exports = router;
