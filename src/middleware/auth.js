const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Verifica el token JWT del header Authorization: Bearer <token>
 * Si es válido, agrega req.user = { id, username, role }
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado, inicia sesión nuevamente' });
    }
    logger.warn({ err: err.message }, 'Token JWT inválido');
    return res.status(401).json({ error: 'Token inválido' });
  }
}

/**
 * Restringe el acceso a uno o varios roles.
 * Debe usarse después de authenticate.
 * Ejemplo: requireRole('teacher')  |  requireRole('student', 'parent')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn({ userId: req.user.id, role: req.user.role, required: roles }, 'Acceso denegado por rol');
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Se requiere rol: ${roles.join(' o ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
