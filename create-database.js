// Script para crear la base de datos en RDS
// Ejecutar: node create-database.js

require('dotenv').config();
const { Pool } = require('pg');

async function createDatabase() {
  // Primero conectarse a la BD por defecto 'postgres' para crear la nueva BD
  const adminPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres', // Conectarse a la BD por defecto
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  const dbName = process.env.DB_NAME || 'sistema_reciclaje';

  try {
    console.log('🔄 Conectando a RDS (base de datos postgres)...');
    const client = await adminPool.connect();
    
    // Verificar si la base de datos ya existe
    console.log(`\n📋 Verificando si la base de datos '${dbName}' existe...`);
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ La base de datos '${dbName}' ya existe!`);
    } else {
      // Crear la base de datos
      console.log(`\n🔨 Creando base de datos '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de datos '${dbName}' creada exitosamente!`);
    }

    // Listar todas las bases de datos
    console.log('\n📁 Bases de datos disponibles:');
    const dbList = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
    );
    dbList.rows.forEach(row => {
      const marker = row.datname === dbName ? '👉' : '  ';
      console.log(`${marker} ${row.datname}`);
    });

    client.release();
    await adminPool.end();

    console.log(`\n✅ Base de datos '${dbName}' está lista para usar!`);
    console.log('\n💡 Próximo paso: Ejecutar migraciones con: npm run db:migrate');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:');
    console.error('Mensaje:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.error('\n💡 Tu usuario no tiene permisos para crear bases de datos.');
      console.error('   Opciones:');
      console.error('   1. Usar una base de datos existente (cambiar DB_NAME en .env)');
      console.error('   2. Crear la BD manualmente desde AWS Console o pgAdmin');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Error de autenticación. Verifica la contraseña en .env');
    } else if (error.message.includes('could not connect')) {
      console.error('\n💡 No se pudo conectar. Verifica:');
      console.error('   - Security Group permite conexiones desde tu IP');
      console.error('   - Host y puerto correctos');
    }
    
    await adminPool.end();
    process.exit(1);
  }
}

createDatabase();

