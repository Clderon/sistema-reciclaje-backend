const express = require('express');
const router = express.Router();

// Importar controladores con manejo de errores
let requestController;
try {
  requestController = require('../controllers/requestController');
} catch (error) {
  console.error('❌ Error cargando requestController:', error);
  throw error;
}

const { createRequest, getPendingRequests, approveRequest, rejectRequest } = requestController;

// POST /api/requests - Crear petición de revisión (estudiante)
router.post('/', createRequest);

// GET /api/requests/pending - Obtener peticiones pendientes (docente)
router.get('/pending', getPendingRequests);

// POST /api/requests/:id/approve - Aprobar petición (docente)
router.post('/:id/approve', approveRequest);

// POST /api/requests/:id/reject - Rechazar petición (docente)
router.post('/:id/reject', rejectRequest);

module.exports = router;

