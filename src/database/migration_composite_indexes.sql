-- Migración: Índices compuestos para optimizar consultas frecuentes
-- Ejecutar en Supabase SQL Editor o via: npm run db:migrate
-- Todos usan IF NOT EXISTS — son seguros de correr en una DB existente

-- Ranking queries: WHERE role = ? ORDER BY total_points DESC
-- Reemplaza los dos índices separados idx_users_role e idx_users_points
CREATE INDEX IF NOT EXISTS idx_users_role_points ON users(role, total_points DESC);

-- Ranking por reciclajes totales (por si se añade ese sort)
CREATE INDEX IF NOT EXISTS idx_users_role_recyclings ON users(role, total_recyclings DESC);

-- getPendingRequests: WHERE status = 'pending' ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_requests_status_date ON recycling_requests(status, created_at DESC);

-- getUserRecyclingHistory: WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_recycling_user_date ON recycling_records(user_id, created_at DESC);

-- getAllBadges / checkAndAwardBadges: ORDER BY required_points ASC
CREATE INDEX IF NOT EXISTS idx_badges_required_points ON badges(required_points ASC);

-- getUserBadges JOIN: user_badges.badge_id -> badges.id
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
