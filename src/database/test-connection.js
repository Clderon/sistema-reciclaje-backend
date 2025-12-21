/**
 * Script de prueba de conexión
 * Permite seleccionar entorno (local o aws) y probar conexiones
 */

const { testConnection: testDB } = require('../config/database');
const { testConnection: testS3 } = require('../config/s3');
const { getEnvironmentInfo, ENVIRONMENTS } = require('../config/environment');

async function testConnections() {
  const envInfo = getEnvironmentInfo();
  const isLocal = envInfo.current.toLowerCase() === ENVIRONMENTS.LOCAL;
  
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 TEST DE CONEXIÓN - SELVAGO BACKEND');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📌 Entorno actual: ${envInfo.current.toUpperCase()}\n`);
  
  // Mostrar configuración según el entorno
  if (isLocal) {
    console.log('📊 Configuración LOCAL:');
    console.log(`   Base de datos: ${envInfo.database.source}`);
    if (envInfo.database.host) {
      console.log(`   Host: ${envInfo.database.host}:${envInfo.database.port}`);
      console.log(`   Database: ${envInfo.database.database}`);
      console.log(`   User: ${envInfo.database.user}`);
    }
    console.log(`   Almacenamiento: ${envInfo.s3.source}`);
    if (envInfo.s3.enabled) {
      console.log(`   Endpoint: ${envInfo.s3.endpoint || 'N/A'}`);
      console.log(`   Bucket: ${envInfo.s3.bucketName || 'N/A'}`);
    }
  } else {
    console.log('📊 Configuración Cloud (Supabase/RDS) + R2:');
    console.log(`   Base de datos: ${envInfo.database.source}`);
    console.log(`   Almacenamiento: ${envInfo.s3.source}`);
    if (envInfo.s3.enabled) {
      if (envInfo.s3.endpoint) {
        console.log(`   Endpoint: ${envInfo.s3.endpoint}`);
      }
      console.log(`   Región: ${envInfo.s3.region || 'N/A'}`);
      console.log(`   Bucket: ${envInfo.s3.bucketName || 'N/A'}`);
    }
  }
  
  console.log('\n───────────────────────────────────────────────────\n');

  let dbSuccess = false;
  let storageSuccess = false;
  let dbError = null;
  let storageError = null;

  // Probar conexión a base de datos
  try {
    const dbLabel = isLocal ? 'Docker local' : (envInfo.database.source.includes('Supabase') ? 'Supabase' : 'Cloud PostgreSQL');
    console.log(`🔍 Probando conexión a PostgreSQL (${dbLabel})...`);
    await testDB();
    dbSuccess = true;
    console.log('');
  } catch (error) {
    dbError = error;
    console.error(`❌ Error en base de datos: ${error.message}\n`);
    
    if (isLocal) {
      console.log('💡 Solución para PostgreSQL local:');
      console.log('   1. Verifica que el contenedor esté corriendo: docker ps');
      console.log('   2. Si no está corriendo, inícialo: docker start selvago_db');
      console.log('   3. Si no existe, créalo con:');
      console.log('      docker run --name selvago_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=SelvaGO -p 5432:5432 -d postgres:16\n');
    }
  }

  console.log('───────────────────────────────────────────────────\n');

  // Probar conexión a almacenamiento (solo Cloudflare R2)
  if (envInfo.s3.enabled) {
    try {
      console.log(`🔍 Probando conexión a Cloudflare R2...`);
      await testS3();
      storageSuccess = true;
      console.log('');
    } catch (error) {
      storageError = error;
      console.error(`❌ Error en Cloudflare R2: ${error.message}\n`);
      
      console.log('💡 Solución para Cloudflare R2:');
      console.log('   1. Verifica tus credenciales en .env (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
      console.log('   2. Verifica que el R2_BUCKET_NAME sea correcto ("selva-go")');
      console.log('   3. Verifica que el R2_ENDPOINT sea correcto (https://[tu-account-id].r2.cloudflarestorage.com)');
      console.log('   4. Asegúrate de que el bucket "selva-go" exista en Cloudflare R2 y que el token API tenga permisos de lectura/escritura.');
      console.log('   5. Revisa el archivo COMO_CONFIGURAR_R2.md para una guía detallada.\n');
    }
  } else {
    console.log('ℹ️  Almacenamiento deshabilitado (modo local o sin R2 configurado)\n');
  }

  console.log('───────────────────────────────────────────────────\n');
  console.log('📊 RESUMEN DE CONEXIONES:');
  console.log(`   ${dbSuccess ? '✅' : '❌'} PostgreSQL: ${dbSuccess ? 'OK' : 'FALLO'}`);
  
  if (envInfo.s3.enabled) {
    console.log(`   ${storageSuccess ? '✅' : '❌'} Cloudflare R2: ${storageSuccess ? 'OK' : 'FALLO'}`);
  } else {
    console.log(`   ⚪ Almacenamiento: N/A (deshabilitado - usa ENVIRONMENT=aws para habilitar R2)`);
  }
  
  console.log('═══════════════════════════════════════════════════\n');

  // Determinar resultado final
  const allRequiredConnectionsOK = dbSuccess && (!envInfo.s3.enabled || storageSuccess);
  
  if (allRequiredConnectionsOK) {
    console.log('✅ ¡Todas las conexiones exitosas!\n');
    if (isLocal) {
      console.log('🎉 Tu entorno local está listo para desarrollar.');
      console.log('   - PostgreSQL corriendo en localhost:5432');
      console.log('   - Para usar almacenamiento, configura ENVIRONMENT=aws y Cloudflare R2\n');
    }
    process.exit(0);
  } else {
    console.log('❌ Algunas conexiones fallaron. Revisa la configuración arriba.\n');
    
    if (isLocal) {
      console.log('💡 Comandos útiles:');
      console.log('   - Ver contenedores corriendo: docker ps');
      console.log('   - Ver todos los contenedores: docker ps -a');
      console.log('   - Iniciar PostgreSQL: docker start selvago_db');
      console.log('   - Ver logs de PostgreSQL: docker logs selvago_db\n');
    } else {
      console.log('💡 Para cambiar de entorno:');
      console.log('   - LOCAL: npm run test:connection:local');
      console.log('   - R2: npm run test:connection:r2\n');
      console.log('   💡 Si el problema es con Cloudflare R2, revisa el archivo COMO_CONFIGURAR_R2.md para una guía detallada.\n');
    }
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testConnections();
}

module.exports = { testConnections };

