const { query } = require('../config/database');
const bcrypt = require('bcrypt');

// Registro con email y password (para alumnos)
async function register(req, res) {
  try {
    const { username, email, password, role = 'student' } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere username, email y password'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido',
        message: 'Por favor ingresa un email válido'
      });
    }

    // Validar password (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Contraseña muy corta',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    if (!['student', 'parent', 'teacher'].includes(role)) {
      return res.status(400).json({
        error: 'Rol inválido',
        message: 'El rol debe ser: student, parent o teacher'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Este nombre de usuario o email ya está en uso'
      });
    }

    // Hashear password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, total_points, total_recyclings, current_level)
       VALUES ($1, $2, $3, $4, 0, 0, 'Hormiga')
       RETURNING id, username, email, role, total_points, total_recyclings, current_level, created_at`,
      [username, email, password_hash, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        totalPoints: user.total_points,
        totalRecyclings: user.total_recyclings,
        currentLevel: user.current_level,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Login con email/username y password
async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere email/username y password'
      });
    }

    // Buscar usuario por email o username
    const result = await query(
      `SELECT id, username, email, password_hash, role, total_points, total_recyclings, current_level, 
              avatar_url, created_at, updated_at
       FROM users 
       WHERE username = $1 OR email = $1`,
      [emailOrUsername]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No existe un usuario con ese email o nombre de usuario'
      });
    }

    const user = result.rows[0];

    // Verificar password si existe
    if (user.password_hash) {
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          error: 'Contraseña incorrecta',
          message: 'La contraseña es incorrecta'
        });
      }
    } else {
      // Usuario antiguo sin password, no permitir login con password
      return res.status(401).json({
        error: 'Autenticación requerida',
        message: 'Este usuario necesita registrarse nuevamente'
      });
    }

    // Login exitoso
    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        totalPoints: user.total_points,
        totalRecyclings: user.total_recyclings,
        currentLevel: user.current_level,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Login o registro (auto-crear si no existe)
async function loginOrRegister(req, res) {
  try {
    const { username, role } = req.body;

    if (!username || !role) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere username y role'
      });
    }

    // Intentar buscar usuario
    const existingUser = await query(
      `SELECT id, username, role, total_points, total_recyclings, current_level, 
              avatar_url, created_at, updated_at
       FROM users 
       WHERE username = $1`,
      [username]
    );

    if (existingUser.rows.length > 0) {
      // Usuario existe, hacer login
      const user = existingUser.rows[0];
      return res.json({
        message: 'Login exitoso',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          totalPoints: user.total_points,
          totalRecyclings: user.total_recyclings,
          currentLevel: user.current_level,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } else {
      // Usuario no existe, crear nuevo
      const result = await query(
        `INSERT INTO users (username, role, total_points, total_recyclings, current_level)
         VALUES ($1, $2, 0, 0, 'Hormiga')
         RETURNING id, username, role, total_points, total_recyclings, current_level, created_at`,
        [username, role]
      );

      const user = result.rows[0];
      return res.status(201).json({
        message: 'Usuario creado y logueado exitosamente',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          totalPoints: user.total_points,
          totalRecyclings: user.total_recyclings,
          currentLevel: user.current_level,
          createdAt: user.created_at
        }
      });
    }
  } catch (error) {
    console.error('Error en loginOrRegister:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

module.exports = {
  register,
  login,
  loginOrRegister
};

