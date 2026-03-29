require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./config/logger');
const { swaggerUi, swaggerDocument } = require('./config/swagger');

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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recycling', recyclingRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/upload', uploadRoutes);
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

