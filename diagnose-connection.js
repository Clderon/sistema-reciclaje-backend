// Script de diagnóstico completo para RDS
// Ejecutar: node diagnose-connection.js

require('dotenv').config();
const { Pool } = require('pg');
const dns = require('dns').promises;

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DE CONEXIÓN A RDS\n');
  console.log('='.repeat(60));

  // 1. Verificar variables de entorno
  console.log('\n📋 1. Verificando variables de entorno...');
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables faltantes:', missingVars.join(', '));
    console.error('💡 Verifica que el archivo .env existe y tiene todas las variables');
    return;
  }

  console.log('✅ Todas las variables están presentes');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log(`   Password: ${process.env.DB_PASSWORD ? '*** (configurada)' : '❌ NO configurada'}`);

  // 2. Verificar resolución DNS
  console.log('\n🌐 2. Verificando resolución DNS...');
  try {
    const hostname = process.env.DB_HOST;
    const addresses = await dns.resolve4(hostname);
    console.log(`✅ DNS resuelto correctamente`);
    console.log(`   IP(s): ${addresses.join(', ')}`);
  } catch (error) {
    console.error(`❌ Error resolviendo DNS: ${error.message}`);
    console.error('💡 Verifica que el hostname es correcto');
    return;
  }

  // 3. Intentar conexión sin SSL primero
  console.log('\n🔌 3. Intentando conexión SIN SSL...');
  try {
    const poolNoSSL = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: 'postgres', // Probar con BD por defecto primero
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
      connectionTimeoutMillis: 5000
    });

    const client = await poolNoSSL.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión exitosa SIN SSL');
    console.log(`   Hora del servidor: ${result.rows[0].now}`);
    client.release();
    await poolNoSSL.end();
  } catch (error) {
    console.error(`❌ Conexión SIN SSL falló: ${error.message}`);
    
    if (error.message.includes('SSL')) {
      console.log('💡 El servidor requiere SSL, probando con SSL...');
    } else if (error.message.includes('timeout')) {
      console.error('❌ TIMEOUT - El servidor no responde');
      console.error('💡 Posibles causas:');
      console.error('   1. Security Group de RDS bloquea tu IP');
      console.error('   2. Firewall local bloquea el puerto 5432');
      console.error('   3. RDS no está disponible');
      return;
    } else if (error.message.includes('password')) {
      console.error('❌ ERROR DE AUTENTICACIÓN');
      console.error('💡 La contraseña es incorrecta');
      return;
    } else if (error.message.includes('does not exist')) {
      console.log('⚠️  La BD no existe, pero la conexión funciona');
    }
  }

  // 4. Intentar conexión CON SSL
  console.log('\n🔒 4. Intentando conexión CON SSL...');
  try {
    const poolSSL = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: 'postgres',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    const client = await poolSSL.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Conexión exitosa CON SSL');
    console.log(`   PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
    
    // Listar bases de datos
    const dbList = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
    );
    console.log(`\n📁 Bases de datos disponibles (${dbList.rows.length}):`);
    dbList.rows.forEach(row => {
      console.log(`   - ${row.datname}`);
    });

    client.release();
    await poolSSL.end();
  } catch (error) {
    console.error(`❌ Conexión CON SSL falló: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.error('\n❌ TIMEOUT - DIAGNÓSTICO:');
      console.error('El servidor RDS no responde. Posibles causas:\n');
      console.error('1. 🔒 Security Group bloquea tu IP');
      console.error('   → Ve a AWS Console → RDS → Tu instancia');
      console.error('   → Connectivity & security → Security Group');
      console.error('   → Inbound rules debe permitir PostgreSQL (5432) desde tu IP\n');
      
      console.error('2. 🚫 Firewall local bloquea puerto 5432');
      console.error('   → Verifica tu firewall de Windows');
      console.error('   → Prueba deshabilitar temporalmente el firewall\n');
      
      console.error('3. 🌐 Problema de red');
      console.error('   → Verifica tu conexión a internet');
      console.error('   → Prueba hacer ping al hostname\n');
    } else if (error.message.includes('password')) {
      console.error('\n❌ ERROR DE AUTENTICACIÓN');
      console.error('La contraseña es incorrecta. Verifica DB_PASSWORD en .env');
    } else if (error.message.includes('does not exist')) {
      console.log('\n✅ La conexión funciona, pero la BD especificada no existe');
      console.log('💡 Ejecuta: npm run db:create');
    }
  }

  // 5. Verificar puerto específico
  console.log('\n🔌 5. Verificando acceso al puerto...');
  console.log('💡 Nota: Esta prueba requiere herramientas adicionales');
  console.log('   Puedes probar manualmente con:');
  console.log(`   telnet ${process.env.DB_HOST} ${process.env.DB_PORT}`);
  console.log('   (Si no tienes telnet, usa PowerShell: Test-NetConnection)');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnóstico completado');
  console.log('\n💡 Si todas las pruebas fallan, revisa el Security Group de RDS');
}

diagnose().catch(error => {
  console.error('Error en diagnóstico:', error);
  process.exit(1);
});

