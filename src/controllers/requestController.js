const { query, getClient } = require('../config/database');
const { calculatePoints, getLevelByPoints } = require('./recyclingController');

// Crear petición de revisión (estudiante envía reciclaje para revisión)
async function createRequest(req, res) {
  try {
    const { userId, categoryId, quantity, unit, evidenceImageUrl } = req.body;

    // Validaciones
    if (!userId || !categoryId || !quantity || !unit || !evidenceImageUrl) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere userId, categoryId, quantity, unit y evidenceImageUrl'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        error: 'Cantidad inválida',
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    // Verificar que el usuario es estudiante
    const userCheck = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    if (userCheck.rows[0].role !== 'student') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo los estudiantes pueden crear peticiones'
      });
    }

    // Crear petición pendiente
    const result = await query(
      `INSERT INTO recycling_requests (student_id, category_id, quantity, unit, evidence_image_url, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, student_id, category_id, quantity, unit, evidence_image_url, status, created_at`,
      [userId, categoryId, quantity, unit, evidenceImageUrl]
    );

    const request = result.rows[0];

    res.status(201).json({
      message: 'Petición enviada exitosamente. Esperando revisión del docente.',
      request: {
        id: request.id,
        studentId: request.student_id,
        categoryId: request.category_id,
        quantity: parseFloat(request.quantity),
        unit: request.unit,
        evidenceImageUrl: request.evidence_image_url,
        status: request.status,
        createdAt: request.created_at
      }
    });
  } catch (error) {
    console.error('Error en createRequest:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Obtener peticiones pendientes (para docentes)
async function getPendingRequests(req, res) {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    // Validar límites
    const validLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const validOffset = Math.max(parseInt(offset, 10) || 0, 0);

    // Obtener peticiones pendientes con información del estudiante
    const result = await query(
      `SELECT 
        r.id,
        r.student_id,
        r.category_id,
        r.quantity,
        r.unit,
        r.evidence_image_url,
        r.status,
        r.created_at,
        u.username as student_name,
        u.avatar_url as student_avatar
       FROM recycling_requests r
       INNER JOIN users u ON r.student_id = u.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC
       LIMIT $1 OFFSET $2`,
      [validLimit, validOffset]
    );

    // Contar total de peticiones pendientes
    const countResult = await query(
      'SELECT COUNT(*) as total FROM recycling_requests WHERE status = $1',
      ['pending']
    );

    const requests = result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentAvatar: row.student_avatar,
      categoryId: row.category_id,
      quantity: parseFloat(row.quantity),
      unit: row.unit,
      evidenceImageUrl: row.evidence_image_url,
      status: row.status,
      createdAt: row.created_at
    }));

    res.json({
      requests,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: validLimit,
        offset: validOffset,
        hasMore: (validOffset + validLimit) < parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error en getPendingRequests:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Aprobar petición y otorgar puntos (docente)
async function approveRequest(req, res) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { teacherId, points } = req.body; // points es opcional, se calcula si no se proporciona

    // Validaciones
    if (!teacherId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere teacherId'
      });
    }

    // Verificar que el docente existe y es docente
    const teacherCheck = await client.query(
      'SELECT id, role FROM users WHERE id = $1',
      [teacherId]
    );

    if (teacherCheck.rows.length === 0 || teacherCheck.rows[0].role !== 'teacher') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo los docentes pueden aprobar peticiones'
      });
    }

    // Obtener la petición
    const requestResult = await client.query(
      `SELECT * FROM recycling_requests WHERE id = $1 AND status = 'pending'`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Petición no encontrada o ya fue procesada'
      });
    }

    const request = requestResult.rows[0];

    // Calcular puntos si no se proporcionaron
    const pointsAwarded = points || calculatePoints(request.category_id, parseFloat(request.quantity), request.unit);

    // Actualizar estado de la petición
    await client.query(
      `UPDATE recycling_requests 
       SET status = 'approved',
           reviewed_by = $1,
           points_awarded = $2,
           reviewed_at = NOW()
       WHERE id = $3`,
      [teacherId, pointsAwarded, id]
    );

    // Crear registro de reciclaje
    const recyclingResult = await client.query(
      `INSERT INTO recycling_records (user_id, category_id, quantity, unit, points_earned, evidence_image_url, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [request.student_id, request.category_id, request.quantity, request.unit, pointsAwarded, request.evidence_image_url, id]
    );

    // Actualizar puntos totales del estudiante
    const updateResult = await client.query(
      `UPDATE users 
       SET total_points = total_points + $1,
           total_recyclings = total_recyclings + 1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING total_points, total_recyclings`,
      [pointsAwarded, request.student_id]
    );

    const newTotalPoints = updateResult.rows[0].total_points;
    const newTotalRecyclings = updateResult.rows[0].total_recyclings;

    // Actualizar nivel si corresponde
    const newLevel = getLevelByPoints(newTotalPoints);
    await client.query(
      `UPDATE users 
       SET current_level = $1
       WHERE id = $2 AND current_level != $1`,
      [newLevel, request.student_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Petición aprobada exitosamente',
      request: {
        id: parseInt(id),
        status: 'approved',
        pointsAwarded
      },
      studentStats: {
        totalPoints: newTotalPoints,
        totalRecyclings: newTotalRecyclings,
        currentLevel: newLevel
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en approveRequest:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  } finally {
    client.release();
  }
}

// Rechazar petición (docente)
async function rejectRequest(req, res) {
  try {
    const { id } = req.params;
    const { teacherId, message } = req.body;

    // Validaciones
    if (!teacherId) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere teacherId'
      });
    }

    // Verificar que el docente existe y es docente
    const teacherCheck = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [teacherId]
    );

    if (teacherCheck.rows.length === 0 || teacherCheck.rows[0].role !== 'teacher') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo los docentes pueden rechazar peticiones'
      });
    }

    // Verificar que la petición existe y está pendiente
    const requestCheck = await query(
      'SELECT id FROM recycling_requests WHERE id = $1 AND status = $2',
      [id, 'pending']
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Petición no encontrada o ya fue procesada'
      });
    }

    // Actualizar estado de la petición
    await query(
      `UPDATE recycling_requests 
       SET status = 'rejected',
           reviewed_by = $1,
           review_message = $2,
           reviewed_at = NOW()
       WHERE id = $3`,
      [teacherId, message || null, id]
    );

    res.json({
      message: 'Petición rechazada exitosamente',
      request: {
        id: parseInt(id),
        status: 'rejected'
      }
    });

  } catch (error) {
    console.error('Error en rejectRequest:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

module.exports = {
  createRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest
};

