const { query, getClient } = require('../config/database');

// Función para calcular puntos según categoría y cantidad
function calculatePoints(categoryId, quantity, unit) {
  // Puntos base por categoría (puedes ajustar estos valores)
  const pointsPerUnit = {
    1: { kg: 10, unid: 0 },      // Papel/Cartón
    2: { kg: 0, unid: 5 },       // Plástico
    3: { kg: 0, unid: 5 },       // Metal
    4: { kg: 0, unid: 5 },       // Vidrio
    5: { kg: 8, unid: 0 },       // Orgánico
    6: { kg: 7, unid: 0 }        // Otros
  };

  const pointsConfig = pointsPerUnit[categoryId] || { kg: 0, unid: 0 };
  const unitKey = unit.toLowerCase().includes('kg') ? 'kg' : 'unid';
  const pointsPer = pointsConfig[unitKey] || 0;

  return Math.floor(quantity * pointsPer);
}

// Función para determinar nivel según puntos totales
function getLevelByPoints(totalPoints) {
  if (totalPoints >= 1000) return 'Gallito de las Rocas';
  if (totalPoints >= 800) return 'Elefante';
  if (totalPoints >= 600) return 'Mono';
  if (totalPoints >= 400) return 'Oso Perezoso';
  if (totalPoints >= 200) return 'Hormiga';
  return 'Hormiga';
}

// Registrar nuevo reciclaje
async function createRecycling(req, res) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { userId, categoryId, quantity, unit, evidenceImageUrl } = req.body;

    // Validaciones
    if (!userId || !categoryId || !quantity || !unit) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere userId, categoryId, quantity y unit'
      });
    }

    if (quantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Cantidad inválida',
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    // Calcular puntos
    const pointsEarned = calculatePoints(categoryId, quantity, unit);

    // Insertar registro de reciclaje
    const recyclingResult = await client.query(
      `INSERT INTO recycling_records (user_id, category_id, quantity, unit, points_earned, evidence_image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, category_id, quantity, unit, points_earned, evidence_image_url, created_at`,
      [userId, categoryId, quantity, unit, pointsEarned, evidenceImageUrl || null]
    );

    // Actualizar puntos totales del usuario
    const updateResult = await client.query(
      `UPDATE users 
       SET total_points = total_points + $1,
           total_recyclings = total_recyclings + 1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING total_points, total_recyclings`,
      [pointsEarned, userId]
    );

    // Obtener puntos actualizados
    const newTotalPoints = updateResult.rows[0].total_points;
    const newTotalRecyclings = updateResult.rows[0].total_recyclings;

    // Actualizar nivel si corresponde
    const newLevel = getLevelByPoints(newTotalPoints);
    await client.query(
      `UPDATE users 
       SET current_level = $1
       WHERE id = $2 AND current_level != $1`,
      [newLevel, userId]
    );

    await client.query('COMMIT');

    const recycling = recyclingResult.rows[0];

    res.status(201).json({
      message: 'Reciclaje registrado exitosamente',
      recycling: {
        id: recycling.id,
        userId: recycling.user_id,
        categoryId: recycling.category_id,
        quantity: parseFloat(recycling.quantity),
        unit: recycling.unit,
        pointsEarned: recycling.points_earned,
        evidenceImageUrl: recycling.evidence_image_url,
        createdAt: recycling.created_at
      },
      userStats: {
        totalPoints: newTotalPoints,
        totalRecyclings: newTotalRecyclings,
        currentLevel: newLevel
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en createRecycling:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  } finally {
    client.release();
  }
}

// Obtener historial de reciclajes de un usuario
async function getUserRecyclingHistory(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT id, user_id, category_id, quantity, unit, points_earned, 
              evidence_image_url, created_at
       FROM recycling_records
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM recycling_records WHERE user_id = $1',
      [userId]
    );

    res.json({
      recyclings: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        pointsEarned: row.points_earned,
        evidenceImageUrl: row.evidence_image_url,
        createdAt: row.created_at
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error en getUserRecyclingHistory:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

module.exports = {
  createRecycling,
  getUserRecyclingHistory
};

