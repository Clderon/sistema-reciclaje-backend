/**
 * Script para insertar docentes de prueba en la base de datos
 * 
 * Ejecutar desde la carpeta del backend:
 * node seed-teachers.js
 */

const { query } = require('./src/config/database');
const bcrypt = require('bcrypt');

// Datos de los docentes
// username: solo el nombre (antes del primer punto)
// password: nombre.apellido (antes del @)
const teachers = [
  {
    email: 'abigail.durand@unas.edu.pe',
    username: 'abigail',  // Solo el nombre
    password: 'abigail.durand',  // nombre.apellido (antes del @)
    role: 'teacher'
  },
  {
    email: 'elia.gonzales@unas.edu.pe',
    username: 'elia',  // Solo el nombre
    password: 'elia.gonzales',  // nombre.apellido (antes del @)
    role: 'teacher'
  },
  {
    email: 'daniel.leon@unas.edu.pe',
    username: 'daniel',  // Solo el nombre
    password: 'daniel.leon',  // nombre.apellido (antes del @)
    role: 'teacher'
  },
  {
    email: 'luis.calderon@unas.edu.pe',
    username: 'luis',  // Solo el nombre
    password: 'luis.calderon',  // nombre.apellido (antes del @)
    role: 'teacher'
  }
];

async function seedTeachers() {
  try {
    console.log('🌱 Iniciando inserción de docentes...\n');

    for (const teacher of teachers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await query(
          'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
          [teacher.username, teacher.email]
        );

        if (existingUser.rows.length > 0) {
          console.log(`⚠️  El usuario ${teacher.email} ya existe. Omitiendo...`);
          continue;
        }

        // Hashear la contraseña
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(teacher.password, saltRounds);

        // Insertar el docente
        const result = await query(
          `INSERT INTO users (username, email, password_hash, role, total_points, total_recyclings, current_level)
           VALUES ($1, $2, $3, $4, 0, 0, 'Hormiga')
           RETURNING id, username, email, role`,
          [teacher.username, teacher.email, password_hash, teacher.role]
        );

        const insertedTeacher = result.rows[0];
        console.log(`✅ Docente creado exitosamente:`);
        console.log(`   ID: ${insertedTeacher.id}`);
        console.log(`   Email: ${insertedTeacher.email}`);
        console.log(`   Username: ${insertedTeacher.username}`);
        console.log(`   Rol: ${insertedTeacher.role}`);
        console.log(`   Contraseña: ${teacher.password}\n`);

      } catch (error) {
        console.error(`❌ Error al insertar ${teacher.email}:`, error.message);
      }
    }

    console.log('✨ Proceso completado!\n');
    console.log('📋 Resumen de credenciales para pruebas:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    teachers.forEach(teacher => {
      console.log(`\n📧 Email: ${teacher.email}`);
      console.log(`🔑 Contraseña: ${teacher.password}`);
      console.log(`👤 Username: ${teacher.username}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar el script
seedTeachers();

