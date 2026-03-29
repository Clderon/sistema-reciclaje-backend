const { query, getClient } = require('../config/database');
const logger = require('../config/logger');
const { checkAndAwardBadges } = require('../services/badgeService');

// Función para calcular puntos según categoría y cantidad/peso con sistema de escalado
function calculatePoints(categoryId, quantity, unit) {
  // Sistema de puntos escalado por categoría
  // Cada categoría tiene puntos base y posibles bonificaciones por cantidad
  
  const unitKey = unit.toLowerCase().includes('kg') ? 'kg' : 'unid';
  
  // Configuración de puntos por categoría
  const pointsConfig = {
    // 1. Papel/Cartón - Por kg
    1: {
      basePointsPerUnit: 10,      // 10 puntos por kg
      bonusThreshold: 5,           // Bonificación a partir de 5 kg
      bonusMultiplier: 1.2,        // 20% más puntos con bonificación
      unit: 'kg'
    },
    // 2. Plástico - Por unidad
    2: {
      basePointsPerUnit: 5,        // 5 puntos por unidad
      bonusThreshold: 10,          // Bonificación a partir de 10 unidades
      bonusMultiplier: 1.15,       // 15% más puntos con bonificación
      unit: 'unid'
    },
    // 3. Metal - Por unidad
    3: {
      basePointsPerUnit: 6,        // 6 puntos por unidad (un poco más valioso)
      bonusThreshold: 8,           // Bonificación a partir de 8 unidades
      bonusMultiplier: 1.2,        // 20% más puntos con bonificación
      unit: 'unid'
    },
    // 4. Vidrio - Por unidad
    4: {
      basePointsPerUnit: 5,        // 5 puntos por unidad
      bonusThreshold: 12,          // Bonificación a partir de 12 unidades
      bonusMultiplier: 1.1,        // 10% más puntos con bonificación
      unit: 'unid'
    },
    // 5. Orgánico - Por kg
    5: {
      basePointsPerUnit: 8,        // 8 puntos por kg
      bonusThreshold: 3,           // Bonificación a partir de 3 kg
      bonusMultiplier: 1.25,       // 25% más puntos con bonificación
      unit: 'kg'
    },
    // 6. Otros - Por kg
    6: {
      basePointsPerUnit: 7,        // 7 puntos por kg
      bonusThreshold: 4,           // Bonificación a partir de 4 kg
      bonusMultiplier: 1.15,       // 15% más puntos con bonificación
      unit: 'kg'
    }
  };

  const config = pointsConfig[categoryId];
  if (!config) {
    logger.warn({ categoryId }, 'Categoría no encontrada, usando valores por defecto');
    return Math.floor(quantity * 5);
  }

  if (config.unit !== unitKey) {
    logger.warn({ unitKey, expected: config.unit, categoryId }, 'Unidad no coincide con la categoría');
  }

  // Calcular puntos base
  let totalPoints = quantity * config.basePointsPerUnit;

  // Aplicar bonificación si se alcanza el umbral
  if (quantity >= config.bonusThreshold) {
    totalPoints = totalPoints * config.bonusMultiplier;
  }

  // Redondear hacia abajo para evitar decimales
  return Math.floor(totalPoints);
}

// Función para determinar nivel según puntos totales
// Niveles: Hormiga (0-199), Oso Perezoso (200-399), Mono (400-599), Elefante (600-799), Gallito de las Rocas (800+)
function getLevelByPoints(totalPoints) {
  if (totalPoints >= 800) return 'Gallito de las Rocas';
  if (totalPoints >= 600) return 'Elefante';
  if (totalPoints >= 400) return 'Mono';
  if (totalPoints >= 200) return 'Oso Perezoso';
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

    // Otorgar badges que el usuario ya cumple con sus nuevos puntos
    const newBadges = await checkAndAwardBadges(client, userId, newTotalPoints);

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
        currentLevel: newLevel,
        newBadges,
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error.message }, 'Error en createRecycling');
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
    logger.error({ err: error.message }, 'Error en getUserRecyclingHistory');
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

module.exports = {
  createRecycling,
  getUserRecyclingHistory,
  calculatePoints,
  getLevelByPoints
};

