const logger = require('./logger');

/**
 * Valida las variables de entorno requeridas según el entorno activo.
 * Llama process.exit(1) si falta alguna crítica para evitar arrancar con config rota.
 */
function validateEnv() {
  const env = (process.env.ENVIRONMENT || 'local').toLowerCase();
  const errors = [];
  const warnings = [];

  if (env === 'aws') {
    // Base de datos — requerida en producción
    if (!process.env.DATABASE_URL) {
      // Puede usar variables individuales como fallback
      const hasIndividualVars =
        process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD;
      if (!hasIndividualVars) {
        errors.push('DATABASE_URL (o DB_HOST + DB_NAME + DB_USER + DB_PASSWORD) es requerida cuando ENVIRONMENT=aws');
      }
    }

    // Cloudflare R2 — advertencia si faltan (el servidor puede arrancar sin imágenes)
    const r2Vars = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_ENDPOINT'];
    const missingR2 = r2Vars.filter(v => !process.env[v]);
    if (missingR2.length > 0) {
      warnings.push(`R2 storage deshabilitado — faltan: ${missingR2.join(', ')}`);
    }
  }

  // JWT_SECRET — requerida para firmar tokens de autenticación
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET es requerida para la autenticación — agrégala en Render dashboard');
  }

  // Imprimir advertencias (no bloquean el arranque)
  warnings.forEach(w => logger.warn({ warning: w }, 'Configuración incompleta'));

  // Imprimir errores y abortar si hay alguno crítico
  if (errors.length > 0) {
    errors.forEach(e => logger.error({ missing: e }, 'Variable de entorno requerida faltante'));
    logger.error('Abortando — revisa las variables de entorno en Render dashboard o en tu .env');
    process.exit(1);
  }

  logger.info({ environment: env }, 'Validación de variables de entorno OK');
}

module.exports = validateEnv;
