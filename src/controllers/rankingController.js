const { query } = require('../config/database');

// Obtener ranking de estudiantes
// IMPORTANTE: Solo retorna estudiantes (role = 'student')
// Excluye explícitamente docentes (teacher) y padres (parent)
async function getStudentsRanking(req, res) {
  try {
    const { limit = 10 } = req.query;
    
    // Validar y limitar el límite para evitar abusos (mínimo 1, máximo 100)
    const validLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    // Query que SOLO incluye estudiantes (excluye docentes y padres por diseño)
    const result = await query(
      `SELECT id, username, role, total_points, total_recyclings, current_level, avatar_url
       FROM users
       WHERE role = 'student'
       ORDER BY total_points DESC, total_recyclings DESC
       LIMIT $1`,
      [validLimit]
    );

    // Validación adicional de seguridad: filtrar cualquier resultado que no sea estudiante
    // Esto previene que si alguien modifica la base de datos, docentes no aparezcan
    const studentRankings = result.rows
      .filter(row => row.role === 'student')
      .map((row, index) => ({
        id: row.id,
        name: row.username,
        role: row.role,
        level: row.current_level,
        points: row.total_points,
        recyclings: row.total_recyclings,
        avatar: row.avatar_url,
        position: index + 1
      }));

    res.json({
      rankings: studentRankings,
      role: 'student',
      count: studentRankings.length
    });
  } catch (error) {
    console.error('Error en getStudentsRanking:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Obtener ranking de docentes
async function getTeachersRanking(req, res) {
  try {
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT id, username, role, total_points, total_recyclings, current_level, avatar_url
       FROM users
       WHERE role = 'teacher'
       ORDER BY total_points DESC, total_recyclings DESC
       LIMIT $1`,
      [limit]
    );

    const rankings = result.rows.map((row, index) => ({
      id: row.id,
      name: row.username,
      role: row.role,
      level: row.current_level,
      points: row.total_points,
      recyclings: row.total_recyclings,
      avatar: row.avatar_url,
      position: index + 1
    }));

    res.json({
      rankings,
      role: 'teacher'
    });
  } catch (error) {
    console.error('Error en getTeachersRanking:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Obtener ranking de padres
async function getParentsRanking(req, res) {
  try {
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT id, username, role, total_points, total_recyclings, current_level, avatar_url
       FROM users
       WHERE role = 'parent'
       ORDER BY total_points DESC, total_recyclings DESC
       LIMIT $1`,
      [limit]
    );

    const rankings = result.rows.map((row, index) => ({
      id: row.id,
      name: row.username,
      role: row.role,
      level: row.current_level,
      points: row.total_points,
      recyclings: row.total_recyclings,
      avatar: row.avatar_url,
      position: index + 1
    }));

    res.json({
      rankings,
      role: 'parent'
    });
  } catch (error) {
    console.error('Error en getParentsRanking:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

module.exports = {
  getStudentsRanking,
  getTeachersRanking,
  getParentsRanking
};

