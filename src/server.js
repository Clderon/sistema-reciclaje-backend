require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recyclingRoutes = require('./routes/recycling');
const rankingRoutes = require('./routes/ranking');
const badgeRoutes = require('./routes/badges');
const uploadRoutes = require('./routes/upload');

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

// Logging de requests (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Ruta de salud (health check)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Sistema de Reciclaje API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recycling', recyclingRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/upload', uploadRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
async function startServer() {
  try {
    // Probar conexión a base de datos
    await testConnection();
    console.log('✅ Conexión a base de datos establecida');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API base: http://localhost:${PORT}/api`);
      if (process.env.DATABASE_URL) {
        console.log(`💾 Base de datos: Conectada (RDS/Render)`);
      } else {
        console.log(`💾 Base de datos: ${process.env.DB_HOST || 'localhost'}`);
      }
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

