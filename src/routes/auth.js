const express = require('express');
const router = express.Router();
const { register, login, loginOrRegister } = require('../controllers/authController');

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', register);

// POST /api/auth/login - Login de usuario existente
router.post('/login', login);

// POST /api/auth/login-or-register - Login o registro automático (recomendado)
router.post('/login-or-register', loginOrRegister);

module.exports = router;

