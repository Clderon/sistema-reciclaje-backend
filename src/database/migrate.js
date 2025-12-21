const fs = require('fs');
const path = require('path');
const { query, testConnection } = require('../config/database');

/**
 * Script unificado de migración
 * Ejecuta el schema inicial y las migraciones adicionales
 */

async function migrate() {
  try {
    console.log('🔄 Iniciando migración de base de datos...\n');
    
    // Probar conexión primero
    await testConnection();
    console.log('');

    // 1. Ejecutar schema principal (crea todas las tablas base)
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Ejecutando schema principal (schema.sql)...');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      await query(schemaSQL);
      console.log('✅ Schema principal creado exitosamente\n');
    }

    // 2. Ejecutar migraciones adicionales si existen
    const migrationPath = path.join(__dirname, 'migration_add_recycling_requests.sql');
    if (fs.existsSync(migrationPath)) {
      console.log('📄 Ejecutando migración adicional (migration_add_recycling_requests.sql)...');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Ejecutar migración línea por línea, respetando bloques DO $$
      await executeMigrationSQL(migrationSQL);
      console.log('✅ Migración adicional completada\n');
    }

    console.log('✅ Migración de estructura completada exitosamente!');
    console.log('\n💡 Ejecuta "npm run db:seed" para insertar datos iniciales (badges y profesores)\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Ejecuta SQL de migración respetando bloques DO $$
 */
async function executeMigrationSQL(sql) {
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
        console.log(`   ✅ Bloque DO ejecutado (líneas ${doBlockStart + 1}-${i + 1})`);
      } catch (error) {
        // Ignorar errores de "does not exist" para DROP IF EXISTS
        if (!error.message.includes('does not exist') && 
            !error.message.includes('already exists')) {
          console.log(`   ⚠️  Bloque DO: ${error.message}`);
        }
      }
      currentCommand = '';
    } else if (!inDoBlock && trimmedLine.endsWith(';')) {
      // Comando normal que termina en ;
      try {
        await query(currentCommand.trim());
      } catch (error) {
        // Ignorar errores de "does not exist" para DROP IF EXISTS
        if (!error.message.includes('does not exist') && 
            !error.message.includes('already exists')) {
          throw error;
        }
      }
      currentCommand = '';
    }
  }

  // Ejecutar cualquier comando restante
  if (currentCommand.trim() && !inDoBlock) {
    try {
      await query(currentCommand.trim());
    } catch (error) {
      if (!error.message.includes('does not exist') && 
          !error.message.includes('already exists')) {
        throw error;
      }
    }
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
