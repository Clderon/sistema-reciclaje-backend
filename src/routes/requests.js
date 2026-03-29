const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRequestSchema, approveRequestSchema, rejectRequestSchema } = require('../middleware/schemas');

let requestController;
try {
  requestController = require('../controllers/requestController');
} catch (error) {
  const logger = require('../config/logger');
  logger.error({ err: error.message }, 'Error cargando requestController');
  throw error;
}

const { createRequest, getPendingRequests, approveRequest, rejectRequest } = requestController;

// POST /api/requests — solo estudiantes
router.post('/', authenticate, requireRole('student'), validate(createRequestSchema), createRequest);

// GET /api/requests/pending — solo docentes
router.get('/pending', authenticate, requireRole('teacher'), getPendingRequests);

// POST /api/requests/:id/approve — solo docentes
router.post('/:id/approve', authenticate, requireRole('teacher'), validate(approveRequestSchema), approveRequest);

// POST /api/requests/:id/reject — solo docentes
router.post('/:id/reject', authenticate, requireRole('teacher'), validate(rejectRequestSchema), rejectRequest);

module.exports = router;
