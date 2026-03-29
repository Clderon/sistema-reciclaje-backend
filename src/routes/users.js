const express = require('express');
const router = express.Router();
const { getUserById, updateUser } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateUserSchema } = require('../middleware/schemas');

// GET /api/users/:id — requiere token
router.get('/:id', authenticate, getUserById);

// PUT /api/users/:id — requiere token
router.put('/:id', authenticate, validate(updateUserSchema), updateUser);

module.exports = router;
