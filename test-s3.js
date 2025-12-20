// Script para probar conexión a S3
// Ejecutar: node test-s3.js

require('dotenv').config();
const { testConnection } = require('./src/config/s3');

async function test() {
  console.log('🔍 Verificando configuración de S3...\n');
  
  // Verificar variables de entorno
  const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME', 'AWS_REGION'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\n💡 Configura estas variables en tu archivo .env');
    process.exit(1);
  }

  console.log('✅ Todas las variables están presentes');
  console.log(`   AWS_REGION: ${process.env.AWS_REGION}`);
  console.log(`   S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '*** (configurada)' : '❌ NO configurada'}`);
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '*** (configurada)' : '❌ NO configurada'}`);
  console.log('\n🔌 Intentando conectar a S3...\n');

  try {
    await testConnection();
    console.log('\n✅ Conexión a S3 exitosa!');
    console.log('💡 Puedes usar S3 para almacenar imágenes\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error conectando a S3:');
    console.error('   Mensaje:', error.message);
    
    if (error.message.includes('bucket')) {
      console.error('\n💡 Verifica:');
      console.error('   1. Que el bucket exista en AWS S3');
      console.error('   2. Que el nombre del bucket sea correcto');
    } else if (error.message.includes('Credenciales')) {
      console.error('\n💡 Verifica:');
      console.error('   1. Que AWS_ACCESS_KEY_ID sea correcta');
      console.error('   2. Que AWS_SECRET_ACCESS_KEY sea correcta');
      console.error('   3. Que las credenciales tengan permisos para acceder al bucket');
    } else if (error.message.includes('denegado')) {
      console.error('\n💡 Verifica:');
      console.error('   1. Que el usuario IAM tenga permisos de S3');
      console.error('   2. Política IAM debe incluir: s3:PutObject, s3:GetObject, s3:DeleteObject');
    }
    
    process.exit(1);
  }
}

test();

