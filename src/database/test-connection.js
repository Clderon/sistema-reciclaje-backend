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
    console.log('📊 Configuración AWS:');
    console.log(`   Base de datos: ${envInfo.database.source}`);
    console.log(`   Almacenamiento: ${envInfo.s3.source}`);
    if (envInfo.s3.enabled) {
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
    console.log(`🔍 Probando conexión a PostgreSQL (${isLocal ? 'Docker local' : 'AWS RDS'})...`);
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

  // Probar conexión a almacenamiento
  if (envInfo.s3.enabled) {
    const storageName = isLocal ? 'MinIO' : 'AWS S3';
    try {
      console.log(`🔍 Probando conexión a ${storageName}...`);
      await testS3();
      storageSuccess = true;
      console.log('');
    } catch (error) {
      storageError = error;
      console.error(`❌ Error en ${storageName}: ${error.message}\n`);
      
      if (isLocal) {
        console.log('💡 Solución para MinIO local:');
        console.log('   1. Verifica que el contenedor esté corriendo: docker ps');
        console.log('   2. Si no está corriendo, inícialo: docker start minio_reciclaje');
        console.log('   3. Si no existe, créalo con:');
        console.log('      docker run --name minio_reciclaje -p 9000:9000 -p 9001:9001 -e "MINIO_ROOT_USER=minioadmin" -e "MINIO_ROOT_PASSWORD=minioadmin" -v minio_data:/data -d minio/minio server /data --console-address ":9001"');
        console.log('   4. Accede a la consola en http://localhost:9001 y crea el bucket "selvago"\n');
      }
    }
  } else {
    console.log('ℹ️  Almacenamiento deshabilitado (USE_MINIO=false o modo AWS sin S3)\n');
  }

  console.log('───────────────────────────────────────────────────\n');
  console.log('📊 RESUMEN DE CONEXIONES:');
  console.log(`   ${dbSuccess ? '✅' : '❌'} PostgreSQL: ${dbSuccess ? 'OK' : 'FALLO'}`);
  
  if (envInfo.s3.enabled) {
    const storageName = isLocal ? 'MinIO' : 'AWS S3';
    console.log(`   ${storageSuccess ? '✅' : '❌'} ${storageName}: ${storageSuccess ? 'OK' : 'FALLO'}`);
  } else {
    console.log(`   ⚪ Almacenamiento: N/A (deshabilitado)`);
  }
  
  console.log('═══════════════════════════════════════════════════\n');

  // Determinar resultado final
  const allRequiredConnectionsOK = dbSuccess && (!envInfo.s3.enabled || storageSuccess);
  
  if (allRequiredConnectionsOK) {
    console.log('✅ ¡Todas las conexiones exitosas!\n');
    if (isLocal) {
      console.log('🎉 Tu entorno local está listo para desarrollar.');
      console.log('   - PostgreSQL corriendo en localhost:5432');
      if (envInfo.s3.enabled) {
        console.log('   - MinIO corriendo en localhost:9000');
        console.log('   - MinIO Console disponible en http://localhost:9001\n');
      }
    }
    process.exit(0);
  } else {
    console.log('❌ Algunas conexiones fallaron. Revisa la configuración arriba.\n');
    
    if (isLocal) {
      console.log('💡 Comandos útiles:');
      console.log('   - Ver contenedores corriendo: docker ps');
      console.log('   - Ver todos los contenedores: docker ps -a');
      console.log('   - Iniciar PostgreSQL: docker start selvago_db');
      console.log('   - Iniciar MinIO: docker start minio_reciclaje');
      console.log('   - Ver logs de PostgreSQL: docker logs selvago_db');
      console.log('   - Ver logs de MinIO: docker logs minio_reciclaje\n');
    } else {
      console.log('💡 Para cambiar de entorno:');
      console.log('   - LOCAL: npm run test:connection:local');
      console.log('   - AWS:   npm run test:connection:aws\n');
    }
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testConnections();
}

module.exports = { testConnections };

