// Script para probar subida de imagen a S3
// Ejecutar: node test-s3-upload.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { uploadImage } = require('./src/config/s3');

async function testUpload() {
  console.log('🧪 TEST DE SUBIDA DE IMAGEN A S3\n');
  console.log('='.repeat(60));

  // Verificar variables de entorno
  const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME', 'AWS_REGION'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  console.log('✅ Variables de entorno configuradas');
  console.log(`   Bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`   Region: ${process.env.AWS_REGION}\n`);

  // Crear una imagen de prueba simple (1x1 pixel PNG en base64)
  // Esta es una imagen PNG válida mínima (1 pixel blanco)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(testImageBase64, 'base64');

  console.log('📤 Subiendo imagen de prueba a S3...\n');

  try {
    const fileName = `test-${Date.now()}.png`;
    const imageUrl = await uploadImage(imageBuffer, fileName, 'image/png');

    console.log('✅ Imagen subida exitosamente!');
    console.log(`\n📎 URL de la imagen:`);
    console.log(`   ${imageUrl}\n`);

    // Verificar que la URL sea accesible
    console.log('🔍 Verificando acceso a la imagen...');
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(imageUrl);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'GET',
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Imagen accesible públicamente (status 200)');
          resolve();
        } else {
          console.warn(`⚠️  Imagen subida pero status: ${res.statusCode}`);
          resolve();
        }
      });

      req.on('error', (error) => {
        console.warn('⚠️  No se pudo verificar acceso:', error.message);
        console.log('   (Esto puede ser normal, la imagen está subida)');
        resolve();
      });

      req.setTimeout(5000, () => {
        console.warn('⚠️  Timeout verificando acceso');
        console.log('   (La imagen está subida, pero no se pudo verificar acceso)');
        req.destroy();
        resolve();
      });

      req.end();
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETADO EXITOSAMENTE');
    console.log('\n💡 S3 está configurado correctamente y funcionando!');
    console.log('💡 Puedes usar este endpoint en tu aplicación:\n');
    console.log('   POST /api/upload/image');
    console.log('   Body: { "image": "data:image/png;base64,...", "fileName": "test.png" }\n');

  } catch (error) {
    console.error('\n❌ Error subiendo imagen:');
    console.error('   Mensaje:', error.message);
    
    if (error.message.includes('bucket')) {
      console.error('\n💡 Verifica:');
      console.error('   1. Que el bucket exista');
      console.error('   2. Que el nombre del bucket sea correcto');
    } else if (error.message.includes('Access Denied') || error.message.includes('Forbidden')) {
      console.error('\n💡 Verifica:');
      console.error('   1. Que las credenciales tengan permisos de S3');
      console.error('   2. Que el usuario IAM tenga permisos: s3:PutObject');
    } else if (error.message.includes('Credentials')) {
      console.error('\n💡 Verifica:');
      console.error('   1. Que AWS_ACCESS_KEY_ID sea correcta');
      console.error('   2. Que AWS_SECRET_ACCESS_KEY sea correcta');
    }

    process.exit(1);
  }
}

testUpload();

