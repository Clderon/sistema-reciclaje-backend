// sistema-reciclaje-backend/src/database/connection.js
/*
    DEPRECADO: Usar src/database/test-connection.js en su lugar
    Este archivo se mantiene por compatibilidad
*/

const { testConnection: configTestConnection } = require('../config/database');

async function testConnection() {
  try {
    await configTestConnection();
    console.log('✅ testConnection: OK');
    return { success: true };
  } catch (error) {
    console.error('❌ testConnection: failed -', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

if (require.main === module) {
  console.log('⚠️  Este script está deprecado. Usa: npm run test:connection\n');
  testConnection().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { testConnection };



