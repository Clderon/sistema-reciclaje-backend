const { query, testConnection } = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * Script unificado de seed (datos iniciales)
 * Inserta badges, profesores y cualquier otro dato inicial
 */

// Datos de badges/logros iniciales
const badges = [
  { name: 'Hormiga Iniciante', description: 'Comienza tu aventura en el reciclaje', required_points: 0, category: 'Hormiga' },
  { name: 'Hormiga Trabajadora', description: 'Has reciclado 50 unidades', required_points: 200, category: 'Hormiga' },
  { name: 'Mono Ágil', description: 'Has alcanzado 400 puntos', required_points: 400, category: 'Mono' },
  { name: 'Mono Experto', description: 'Has alcanzado 600 puntos', required_points: 600, category: 'Mono' },
  { name: 'Elefante Sabio', description: 'Has alcanzado 800 puntos', required_points: 800, category: 'Elefante' },
  { name: 'Gallito Campeón', description: 'Has alcanzado 1000 puntos', required_points: 1000, category: 'Gallito de las Rocas' }
];

// Datos de profesores
const teachers = [
  {
    email: 'abigail.durand@unas.edu.pe',
    username: 'abigail',
    password: 'abigail.durand',
    role: 'teacher'
  },
  {
    email: 'elia.gonzales@unas.edu.pe',
    username: 'elia',
    password: 'elia.gonzales',
    role: 'teacher'
  },
  {
    email: 'daniel.leon@unas.edu.pe',
    username: 'daniel',
    password: 'daniel.leon',
    role: 'teacher'
  },
  {
    email: 'luis.calderon@unas.edu.pe',
    username: 'luis',
    password: 'luis.calderon',
    role: 'teacher'
  }
];

// Datos de estudiantes (alumnos)
const students = [
  {
    email: 'estudiante1@unas.edu.pe',
    username: 'estudiante1',
    password: 'estudiante1',
    role: 'student'
  },
  {
    email: 'estudiante2@unas.edu.pe',
    username: 'estudiante2',
    password: 'estudiante2',
    role: 'student'
  },
  {
    email: 'juan.perez@unas.edu.pe',
    username: 'juan.perez',
    password: 'juan123',
    role: 'student'
  },
  {
    email: 'maria.garcia@unas.edu.pe',
    username: 'maria.garcia',
    password: 'maria123',
    role: 'student'
  }
];

/**
 * Insertar badges/logros
 */
async function seedBadges() {
  console.log('📄 Insertando badges/logros...');
  let inserted = 0;
  let skipped = 0;

  for (const badge of badges) {
    try {
      // Verificar si el badge ya existe
      const existingBadge = await query(
        'SELECT id FROM badges WHERE name = $1',
        [badge.name]
      );

      if (existingBadge.rows.length > 0) {
        skipped++;
        console.log(`   ⏭️  Badge "${badge.name}" ya existe`);
        continue;
      }

      // Insertar el badge
      const result = await query(
        `INSERT INTO badges (name, description, required_points, category)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [badge.name, badge.description, badge.required_points, badge.category]
      );

      inserted++;
      console.log(`   ✅ Badge "${badge.name}" insertado (ID: ${result.rows[0].id})`);
    } catch (error) {
      // Si es error de UNIQUE, significa que ya existe (aunque la query anterior no lo encontró)
      if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
        skipped++;
        console.log(`   ⏭️  Badge "${badge.name}" ya existe`);
      } else {
        console.error(`   ❌ Error insertando badge "${badge.name}":`, error.message);
      }
    }
  }

  console.log(`✅ Badges: ${inserted} insertados, ${skipped} ya existían\n`);
  return { inserted, skipped };
}

/**
 * Insertar profesores
 */
async function seedTeachers() {
  console.log('📄 Insertando profesores...');
  let inserted = 0;
  let skipped = 0;

  for (const teacher of teachers) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await query(
        'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
        [teacher.username, teacher.email]
      );

      if (existingUser.rows.length > 0) {
        skipped++;
        console.log(`   ⏭️  Profesor ${teacher.email} ya existe`);
        continue;
      }

      // Hashear la contraseña
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(teacher.password, saltRounds);

      // Insertar el profesor
      const result = await query(
        `INSERT INTO users (username, email, password_hash, role, total_points, total_recyclings, current_level)
         VALUES ($1, $2, $3, $4, 0, 0, 'Hormiga')
         RETURNING id, username, email, role`,
        [teacher.username, teacher.email, password_hash, teacher.role]
      );

      inserted++;
      const insertedTeacher = result.rows[0];
      console.log(`   ✅ Profesor "${insertedTeacher.username}" insertado (ID: ${insertedTeacher.id})`);
    } catch (error) {
      console.error(`   ❌ Error insertando profesor ${teacher.email}:`, error.message);
    }
  }

  console.log(`✅ Profesores: ${inserted} insertados, ${skipped} ya existían\n`);
  return { inserted, skipped };
}

/**
 * Insertar estudiantes (alumnos)
 */
async function seedStudents() {
  console.log('📄 Insertando estudiantes...');
  let inserted = 0;
  let skipped = 0;

  for (const student of students) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await query(
        'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
        [student.username, student.email]
      );

      if (existingUser.rows.length > 0) {
        skipped++;
        console.log(`   ⏭️  Estudiante ${student.email} ya existe`);
        continue;
      }

      // Hashear la contraseña
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(student.password, saltRounds);

      // Insertar el estudiante
      const result = await query(
        `INSERT INTO users (username, email, password_hash, role, total_points, total_recyclings, current_level)
         VALUES ($1, $2, $3, $4, 0, 0, 'Hormiga')
         RETURNING id, username, email, role`,
        [student.username, student.email, password_hash, student.role]
      );

      inserted++;
      const insertedStudent = result.rows[0];
      console.log(`   ✅ Estudiante "${insertedStudent.username}" insertado (ID: ${insertedStudent.id})`);
    } catch (error) {
      console.error(`   ❌ Error insertando estudiante ${student.email}:`, error.message);
    }
  }

  console.log(`✅ Estudiantes: ${inserted} insertados, ${skipped} ya existían\n`);
  return { inserted, skipped };
}

/**
 * Función principal de seed
 */
async function seed() {
  try {
    console.log('🌱 Iniciando seed de datos iniciales...\n');

    // Probar conexión primero
    await testConnection();
    console.log('');

    // Insertar badges
    const badgesResult = await seedBadges();

    // Insertar profesores
    const teachersResult = await seedTeachers();

    // Insertar estudiantes
    const studentsResult = await seedStudents();

    // Resumen final
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN DEL SEED:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Badges: ${badgesResult.inserted} insertados, ${badgesResult.skipped} ya existían`);
    console.log(`✅ Profesores: ${teachersResult.inserted} insertados, ${teachersResult.skipped} ya existían`);
    console.log(`✅ Estudiantes: ${studentsResult.inserted} insertados, ${studentsResult.skipped} ya existían`);
    console.log('═══════════════════════════════════════════════════\n');

    // Mostrar credenciales de profesores si se insertaron nuevos
    if (teachersResult.inserted > 0) {
      console.log('📋 Credenciales de profesores insertados:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      teachers.forEach(teacher => {
        console.log(`📧 Email: ${teacher.email}`);
        console.log(`🔑 Contraseña: ${teacher.password}`);
        console.log(`👤 Username: ${teacher.username}`);
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Mostrar credenciales de estudiantes si se insertaron nuevos
    if (studentsResult.inserted > 0) {
      console.log('📋 Credenciales de estudiantes insertados:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      students.forEach(student => {
        console.log(`📧 Email: ${student.email}`);
        console.log(`🔑 Contraseña: ${student.password}`);
        console.log(`👤 Username: ${student.username}`);
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log('✅ Seed completado exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seed();
}

module.exports = { seed, seedBadges, seedTeachers, seedStudents };

