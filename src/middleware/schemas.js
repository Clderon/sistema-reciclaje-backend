const Joi = require('joi');

// ─── Auth ──────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(100).required()
    .messages({ 'string.alphanum': 'El username solo puede tener letras y números' }),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'parent', 'teacher').default('student'),
});

const loginSchema = Joi.object({
  emailOrUsername: Joi.string().max(255).required(),
  password: Joi.string().required(),
});

const loginOrRegisterSchema = Joi.object({
  username: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('student', 'parent', 'teacher').required(),
  // Campos opcionales para compatibilidad
  email: Joi.string().email().max(255).optional().allow('', null),
  password: Joi.string().min(6).max(128).optional().allow('', null),
  avatar_url: Joi.string().uri().max(500).optional().allow('', null),
});

// ─── Users ─────────────────────────────────────────────────────────────────
const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(100).optional(),
  avatarUrl: Joi.string().uri().max(500).optional().allow('', null),
}).min(1).messages({ 'object.min': 'Debes enviar al menos un campo para actualizar' });

// ─── Recycling ─────────────────────────────────────────────────────────────
const recyclingSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  categoryId: Joi.number().integer().min(1).max(6).required()
    .messages({ 'number.min': 'categoryId debe estar entre 1 y 6', 'number.max': 'categoryId debe estar entre 1 y 6' }),
  quantity: Joi.number().positive().max(10000).required(),
  unit: Joi.string().valid('kg', 'Unid.', 'unid').required(),
  evidenceImageUrl: Joi.string().uri().max(500).optional().allow('', null),
});

// ─── Requests ──────────────────────────────────────────────────────────────
const createRequestSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  categoryId: Joi.number().integer().min(1).max(6).required()
    .messages({ 'number.min': 'categoryId debe estar entre 1 y 6', 'number.max': 'categoryId debe estar entre 1 y 6' }),
  quantity: Joi.number().positive().max(10000).required(),
  unit: Joi.string().valid('kg', 'Unid.', 'unid').required(),
  evidenceImageUrl: Joi.string().uri().max(500).required(),
});

const approveRequestSchema = Joi.object({
  teacherId: Joi.number().integer().positive().required(),
  points: Joi.number().integer().min(0).optional(),
  review_message: Joi.string().max(500).optional().allow('', null),
});

const rejectRequestSchema = Joi.object({
  teacherId: Joi.number().integer().positive().required(),
  message: Joi.string().max(500).optional().allow('', null),
});

// ─── Upload ────────────────────────────────────────────────────────────────
const uploadImageSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  imageBase64: Joi.string().required(),
  mimeType: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required(),
  folder: Joi.string().max(100).optional().allow('', null),
});

module.exports = {
  registerSchema,
  loginSchema,
  loginOrRegisterSchema,
  updateUserSchema,
  recyclingSchema,
  createRequestSchema,
  approveRequestSchema,
  rejectRequestSchema,
  uploadImageSchema,
};
