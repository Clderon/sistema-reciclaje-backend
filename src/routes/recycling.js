const express = require('express');
const router = express.Router();
const { createRecycling, getUserRecyclingHistory } = require('../controllers/recyclingController');

// POST /api/recycling - Registrar nuevo reciclaje
router.post('/', createRecycling);

// GET /api/recycling/user/:userId - Obtener historial de reciclajes de un usuario
router.get('/user/:userId', getUserRecyclingHistory);

module.exports = router;

