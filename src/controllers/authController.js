const { query } = require('../config/database');

// Registro simple (solo nombre y rol)
async function register(req, res) {
  try {
    const { username, role } = req.body;

    // Validaciones básicas
    if (!username || !role) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere username y role'
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
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Este nombre de usuario ya está en uso'
      });
    }

    // Crear nuevo usuario
    const result = await query(
      `INSERT INTO users (username, role, total_points, total_recyclings, current_level)
       VALUES ($1, $2, 0, 0, 'Hormiga')
       RETURNING id, username, role, total_points, total_recyclings, current_level, created_at`,
      [username, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
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
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Login simple (solo nombre)
async function login(req, res) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere username'
      });
    }

    // Buscar usuario
    const result = await query(
      `SELECT id, username, role, total_points, total_recyclings, current_level, 
              avatar_url, created_at, updated_at
       FROM users 
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No existe un usuario con ese nombre'
      });
    }

    const user = result.rows[0];

    // Por ahora retornamos los datos directamente
    // Más adelante agregaremos JWT
    res.json({
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

