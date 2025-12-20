const express = require('express');
const router = express.Router();
const { getUserById, updateUser } = require('../controllers/userController');

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', getUserById);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', updateUser);

module.exports = router;

