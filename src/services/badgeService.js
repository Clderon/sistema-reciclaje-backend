const { query: dbQuery } = require('../config/database');
const logger = require('../config/logger');

// Caché en memoria para badges (datos estáticos que cambian raramente)
const BADGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
let badgeCache = null;
let badgeCacheExpiry = 0;

/**
 * Devuelve todos los badges ordenados por puntos requeridos.
 * Usa caché de 1 hora para evitar queries repetidas.
 */
async function getBadgesData() {
  const now = Date.now();
  if (badgeCache && now < badgeCacheExpiry) {
    logger.debug('Badges servidos desde caché');
    return badgeCache;
  }

  const result = await dbQuery(
    `SELECT id, name, description, image_url, required_points, category
     FROM badges
     ORDER BY required_points ASC`
  );

  badgeCache = result.rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    requiredPoints: row.required_points,
    category: row.category,
  }));
  badgeCacheExpiry = now + BADGE_CACHE_TTL_MS;
  logger.debug({ count: badgeCache.length, ttl_min: 60 }, 'Badges cargados en caché');
  return badgeCache;
}

/**
 * Verifica los puntos del usuario contra todos los badges y otorga
 * los que aún no tiene y ya cumple el requisito.
 *
 * Debe llamarse DENTRO de una transacción activa.
 * @param {import('pg').PoolClient} client  — cliente de transacción pg
 * @param {number} userId
 * @param {number} totalPoints              — puntos DESPUÉS de sumar el reciclaje
 * @returns {string[]} nombres de badges recién otorgados
 */
async function checkAndAwardBadges(client, userId, totalPoints) {
  const badges = await getBadgesData();

  const earned = await client.query(
    'SELECT badge_id FROM user_badges WHERE user_id = $1',
    [userId]
  );
  const earnedIds = new Set(earned.rows.map(r => r.badge_id));

  const newBadges = [];
  for (const badge of badges) {
    if (totalPoints >= badge.requiredPoints && !earnedIds.has(badge.id)) {
      await client.query(
        'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, badge.id]
      );
      newBadges.push(badge.name);
      logger.info({ userId, badge: badge.name, totalPoints }, 'Badge otorgado');
    }
  }

  return newBadges;
}

module.exports = { getBadgesData, checkAndAwardBadges };
