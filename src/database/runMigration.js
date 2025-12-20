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

    // Ejecutar el SQL completo línea por línea, respetando bloques DO $$
    const lines = sql.split('\n');
    let currentCommand = '';
    let inDoBlock = false;
    let doBlockStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Omitir líneas vacías y comentarios
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }

      currentCommand += line + '\n';

      // Detectar inicio de bloque DO $$
      if (trimmedLine.includes('DO $$') && !inDoBlock) {
        inDoBlock = true;
        doBlockStart = i;
      }

      // Detectar fin de bloque DO $$ (termina con $$;)
      if (inDoBlock && trimmedLine.includes('$$;')) {
        inDoBlock = false;
        try {
          await query(currentCommand.trim());
          console.log(`✅ DO block ejecutado (líneas ${doBlockStart + 1}-${i + 1})`);
        } catch (error) {
          // Ignorar errores de "does not exist" para DROP IF EXISTS
          if (!error.message.includes('does not exist')) {
            console.log(`⚠️  DO block: ${error.message}`);
          }
        }
        currentCommand = '';
      } else if (!inDoBlock && trimmedLine.endsWith(';')) {
        // Comando normal que termina en ;
        try {
          await query(currentCommand.trim());
          console.log(`✅ Comando ejecutado (línea ${i + 1})`);
        } catch (error) {
          // Ignorar errores de "does not exist" para DROP IF EXISTS y DROP INDEX IF EXISTS
          if (!error.message.includes('does not exist')) {
            throw error;
          } else {
            console.log(`⚠️  ${error.message} (ignorado)`);
          }
        }
        currentCommand = '';
      }
    }

    // Ejecutar cualquier comando restante
    if (currentCommand.trim() && !inDoBlock) {
      try {
        await query(currentCommand.trim());
        console.log('✅ Comando final ejecutado');
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          throw error;
        }
      }
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

