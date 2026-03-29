const express = require('express');
const router = express.Router();
const { register, login, loginOrRegister } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, loginOrRegisterSchema } = require('../middleware/schemas');

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/auth/login-or-register (flujo recomendado para el frontend)
router.post('/login-or-register', validate(loginOrRegisterSchema), loginOrRegister);

module.exports = router;
