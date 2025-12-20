const express = require('express');
const router = express.Router();
const { getAllBadges, getUserBadges } = require('../controllers/badgeController');

// GET /api/badges - Obtener todos los badges disponibles
router.get('/', getAllBadges);

// GET /api/badges/user/:userId - Obtener badges de un usuario
router.get('/user/:userId', getUserBadges);

module.exports = router;

