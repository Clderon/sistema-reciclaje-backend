const fs = require('fs');
const path = require('path');
const { query, testConnection } = require('../config/database');

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración...');
    
    // Probar conexión
    await testConnection();
    console.log('✅ Conexión a base de datos establecida\n');

    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, 'migration_add_recycling_requests.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando migración: migration_add_recycling_requests.sql\n');

    // Ejecutar el SQL completo
    // Dividir por bloques que terminan en ; pero respetando bloques DO $$
    let currentCommand = '';
    let inDoBlock = false;
    let doBlockDepth = 0;

    const executeCommand = async (cmd) => {
      if (!cmd.trim() || cmd.trim().startsWith('--')) return;
      
      try {
        await query(cmd);
        console.log('✅ Comando ejecutado exitosamente');
      } catch (error) {
        // Si ya existe, está bien (CREATE IF NOT EXISTS)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')) {
          console.log(`⚠️  ${error.message}`);
        } else {
          throw error;
        }
      }
    };

    // Ejecutar comandos uno por uno
    const lines = sql.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Omitir comentarios
      if (line.startsWith('--') || line === '') continue;

      currentCommand += line + '\n';

      // Detectar inicio de bloque DO $$
      if (line.includes('DO $$')) {
        inDoBlock = true;
        doBlockDepth = (line.match(/\$\$/g) || []).length;
      }

      // Detectar fin de bloque DO $$ (termina con $$;)
      if (inDoBlock && line.includes('$$;')) {
        doBlockDepth -= (line.match(/\$\$/g) || []).length;
        if (doBlockDepth <= 0) {
          inDoBlock = false;
          await executeCommand(currentCommand);
          currentCommand = '';
        }
      } else if (!inDoBlock && line.endsWith(';')) {
        // Comando normal que termina en ;
        await executeCommand(currentCommand);
        currentCommand = '';
      }
    }

    // Ejecutar cualquier comando restante
    if (currentCommand.trim()) {
      await executeCommand(currentCommand);
    }

    console.log('\n✅ Migración completada exitosamente!');
    console.log('📊 Tabla recycling_requests creada/actualizada');
    console.log('📊 Columna request_id agregada a recycling_records (si no existía)');
    console.log('📊 Índices creados');

  } catch (error) {
    console.error('\n❌ Error ejecutando migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Ejecutar migración
runMigration();

