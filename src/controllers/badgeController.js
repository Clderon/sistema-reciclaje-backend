const { query } = require('../config/database');
const logger = require('../config/logger');
const { getBadgesData } = require('../services/badgeService');

// Obtener todos los badges disponibles
async function getAllBadges(req, res) {
  try {
    const badges = await getBadgesData();
    res.json({ badges });
  } catch (error) {
    logger.error({ err: error.message }, 'Error en getAllBadges');
    res.status(500).json({ error: 'Error interno del servidor' });
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
    logger.error({ err: error.message }, 'Error en getUserBadges');
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getAllBadges,
  getUserBadges
};

