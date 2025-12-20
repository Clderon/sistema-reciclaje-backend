const { query } = require('../config/database');

// Obtener todos los badges disponibles
async function getAllBadges(req, res) {
  try {
    const result = await query(
      `SELECT id, name, description, image_url, required_points, category
       FROM badges
       ORDER BY required_points ASC`
    );

    res.json({
      badges: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        requiredPoints: row.required_points,
        category: row.category
      }))
    });
  } catch (error) {
    console.error('Error en getAllBadges:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Obtener badges de un usuario
async function getUserBadges(req, res) {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT b.id, b.name, b.description, b.image_url, b.required_points, b.category, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    res.json({
      badges: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        requiredPoints: row.required_points,
        category: row.category,
        earnedAt: row.earned_at
      }))
    });
  } catch (error) {
    console.error('Error en getUserBadges:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

module.exports = {
  getAllBadges,
  getUserBadges
};

