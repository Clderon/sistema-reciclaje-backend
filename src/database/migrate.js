const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Iniciando migración de base de datos...');

    // Leer archivo schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Ejecutar schema
    await query(schemaSQL);
    console.log('✅ Schema creado exitosamente');

    // Leer y ejecutar seed
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    await query(seedSQL);
    console.log('✅ Datos iniciales insertados');

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrate();

