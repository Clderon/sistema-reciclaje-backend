require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const validateEnv = require('./config/validateEnv');
const { swaggerUi, swaggerDocument } = require('./config/swagger');

// Validar variables de entorno antes de cualquier otra cosa
validateEnv();

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recyclingRoutes = require('./routes/recycling');
const rankingRoutes = require('./routes/ranking');
const badgeRoutes = require('./routes/badges');
const uploadRoutes = require('./routes/upload');

// Importar rutas de requests con manejo de errores
let requestRoutes;
try {
  requestRoutes = require('./routes/requests');
  logger.info('Ruta /api/requests cargada correctamente');
} catch (error) {
  logger.error({ err: error.message }, 'Error cargando rutas de requests');
  requestRoutes = require('express').Router();
}

// Importar conexión a base de datos
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
// CORS: Permitir todas las conexiones en desarrollo, específicas en producción
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
// General: 100 peticiones por IP cada 15 minutos
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos' },
});

// Auth: 10 intentos por IP cada 15 minutos (protege contra brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos' },
});

// Upload: 20 subidas por IP por hora
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de subidas alcanzado, intenta de nuevo en 1 hora' },
});

app.use('/api/', generalLimiter);

// Logging de requests HTTP
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      { method: req.method, url: req.originalUrl, status: res.statusCode, duration_ms: Date.now() - start },
      'HTTP request'
    );
  });
  next();
})

// Ruta de salud (health check)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Sistema de Reciclaje API is running',
    timestamp: new Date().toISOString()
  });
});

// Documentación API (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Sistema Reciclaje API Docs',
}));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recycling', recyclingRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/requests', requestRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  logger.error({ err: err.message, stack: err.stack, url: req.originalUrl }, 'Error no manejado');
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
async function startServer() {
  try {
    await testConnection();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(
        {
          port: PORT,
          env: process.env.NODE_ENV || 'development',
          health: `http://localhost:${PORT}/health`,
          docs: `http://localhost:${PORT}/api-docs`,
          database: process.env.DATABASE_URL ? 'RDS/Render' : (process.env.DB_HOST || 'localhost'),
        },
        'Servidor iniciado'
      );
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Error al iniciar servidor');
    process.exit(1);
  }
}

startServer();

module.exports = app;

