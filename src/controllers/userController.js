const { query } = require('../config/database');
const { getLevelByPoints } = require('./recyclingController');

// Obtener perfil del usuario actual (por ID)
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, username, role, total_points, total_recyclings, current_level, 
              avatar_url, created_at, updated_at
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];
    
    // Calcular el nivel correcto basado en los puntos actuales
    const correctLevel = getLevelByPoints(user.total_points);
    
    // Si el nivel en la BD está desactualizado, actualizarlo
    if (user.current_level !== correctLevel) {
      await query(
        `UPDATE users SET current_level = $1 WHERE id = $2`,
        [correctLevel, id]
      );
      user.current_level = correctLevel;
    }

    // Obtener conteo de peticiones aprobadas (solo para estudiantes)
    let approvedRequestsCount = 0;
    if (user.role === 'student') {
      const requestsResult = await query(
        `SELECT COUNT(*) as count 
         FROM recycling_requests 
         WHERE student_id = $1 AND status = 'approved'`,
        [id]
      );
      approvedRequestsCount = parseInt(requestsResult.rows[0].count) || 0;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        totalPoints: user.total_points,
        totalRecyclings: user.total_recyclings,
        currentLevel: correctLevel, // Siempre devolver el nivel correcto
        approvedRequestsCount: approvedRequestsCount,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Actualizar perfil de usuario
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, avatarUrl } = req.body;

    // Verificar que el usuario existe
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Si se actualiza username, verificar que no esté en uso
    if (username) {
      const usernameCheck = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );

      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'Nombre de usuario ya en uso'
        });
      }
    }

    // Construir query dinámica
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (avatarUrl) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No hay datos para actualizar'
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, username, role, total_points, total_recyclings, current_level, avatar_url, created_at, updated_at`,
      values
    );

    const user = result.rows[0];

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        totalPoints: user.total_points,
        totalRecyclings: user.total_recyclings,
        currentLevel: user.current_level,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

module.exports = {
  getUserById,
  updateUser
};

