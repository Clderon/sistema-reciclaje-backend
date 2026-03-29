const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Reciclaje API',
    version: '1.0.0',
    description:
      'API para el sistema de reciclaje gamificado escolar. Gestiona usuarios (estudiantes, docentes, padres), registros de reciclaje, solicitudes de aprobación, rankings y badges.',
  },
  servers: [
    {
      url: '/api',
      description: 'API Base',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Registro y login de usuarios' },
    { name: 'Users', description: 'Perfil de usuario' },
    { name: 'Recycling', description: 'Registros de reciclaje' },
    { name: 'Requests', description: 'Solicitudes de reciclaje para aprobación docente' },
    { name: 'Ranking', description: 'Rankings por rol' },
    { name: 'Badges', description: 'Insignias y logros' },
    { name: 'Upload', description: 'Subida de imágenes a Cloudflare R2' },
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'juan_perez' },
          role: { type: 'string', enum: ['student', 'teacher', 'parent'], example: 'student' },
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          avatar_url: { type: 'string', nullable: true, example: null },
          total_points: { type: 'integer', example: 350 },
          total_recyclings: { type: 'integer', example: 12 },
          current_level: { type: 'string', example: 'Mono' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      RecyclingRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          category_id: { type: 'integer', minimum: 1, maximum: 6 },
          quantity: { type: 'number', example: 2.5 },
          unit: { type: 'string', enum: ['kg', 'Unid.', 'unid'] },
          points_earned: { type: 'integer', example: 25 },
          evidence_image_url: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      RecyclingRequest: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          student_id: { type: 'integer' },
          category_id: { type: 'integer', minimum: 1, maximum: 6 },
          quantity: { type: 'number', example: 1.5 },
          unit: { type: 'string', enum: ['kg', 'Unid.', 'unid'] },
          evidence_image_url: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'pending' },
          reviewed_by: { type: 'integer', nullable: true },
          points_awarded: { type: 'integer', nullable: true },
          review_message: { type: 'string', nullable: true },
          reviewed_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Badge: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', example: 'Hormiga' },
          description: { type: 'string' },
          image_url: { type: 'string', nullable: true },
          required_points: { type: 'integer', example: 0 },
          category: { type: 'string', nullable: true },
        },
      },
      RankingEntry: {
        type: 'object',
        properties: {
          rank: { type: 'integer', example: 1 },
          id: { type: 'integer' },
          username: { type: 'string' },
          total_points: { type: 'integer' },
          total_recyclings: { type: 'integer' },
          current_level: { type: 'string' },
          avatar_url: { type: 'string', nullable: true },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensaje de error' },
        },
      },
    },
  },
  paths: {
    // ─── AUTH ──────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar nuevo usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'role', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'juan_perez' },
                  role: { type: 'string', enum: ['student', 'teacher', 'parent'] },
                  email: { type: 'string', format: 'email', example: 'juan@example.com' },
                  password: { type: 'string', minLength: 6, example: 'miPassword123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario registrado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos o usuario ya existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login con email/username y contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: { type: 'string', description: 'Email o username', example: 'juan@example.com' },
                  password: { type: 'string', example: 'miPassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Credenciales incorrectas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login-or-register': {
      post: {
        tags: ['Auth'],
        summary: 'Login automático — crea el usuario si no existe (recomendado)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'role', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'juan_perez' },
                  role: { type: 'string', enum: ['student', 'teacher', 'parent'] },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  avatar_url: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login exitoso', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/User' }, isNewUser: { type: 'boolean' } } } } } },
          400: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ─── USERS ─────────────────────────────────────────────────
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obtener perfil de usuario por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          200: { description: 'Perfil del usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          404: { description: 'Usuario no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar perfil de usuario',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'nuevo_username' },
                  avatarUrl: { type: 'string', example: 'https://r2.example.com/avatar.jpg' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Usuario actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          404: { description: 'Usuario no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ─── RECYCLING ─────────────────────────────────────────────
    '/recycling': {
      post: {
        tags: ['Recycling'],
        summary: 'Registrar reciclaje directamente (sin aprobación)',
        description: 'Crea un registro de reciclaje y suma puntos al usuario. Categorías: 1=Papel/Cartón, 2=Plástico, 3=Metal, 4=Vidrio, 5=Orgánico, 6=Otros',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user_id', 'category_id', 'quantity', 'unit'],
                properties: {
                  user_id: { type: 'integer', example: 1 },
                  category_id: { type: 'integer', minimum: 1, maximum: 6, example: 1 },
                  quantity: { type: 'number', example: 2.5 },
                  unit: { type: 'string', enum: ['kg', 'Unid.', 'unid'], example: 'kg' },
                  evidence_image_url: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Reciclaje registrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    recycling: { $ref: '#/components/schemas/RecyclingRecord' },
                    points_earned: { type: 'integer' },
                    total_points: { type: 'integer' },
                    new_level: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/recycling/user/{userId}': {
      get: {
        tags: ['Recycling'],
        summary: 'Historial de reciclajes de un usuario (paginado)',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Número de página' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Registros por página' },
        ],
        responses: {
          200: {
            description: 'Historial paginado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    records: { type: 'array', items: { $ref: '#/components/schemas/RecyclingRecord' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ─── REQUESTS ──────────────────────────────────────────────
    '/requests': {
      post: {
        tags: ['Requests'],
        summary: 'Estudiante crea solicitud de reciclaje para aprobación docente',
        description: 'Máximo 5 solicitudes por día por estudiante.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['student_id', 'category_id', 'quantity', 'unit'],
                properties: {
                  student_id: { type: 'integer', example: 3 },
                  category_id: { type: 'integer', minimum: 1, maximum: 6, example: 2 },
                  quantity: { type: 'number', example: 5 },
                  unit: { type: 'string', enum: ['kg', 'Unid.', 'unid'], example: 'Unid.' },
                  evidence_image_url: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Solicitud creada', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, request: { $ref: '#/components/schemas/RecyclingRequest' } } } } } },
          400: { description: 'Límite diario alcanzado o datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/requests/pending': {
      get: {
        tags: ['Requests'],
        summary: 'Obtener solicitudes pendientes (para docentes)',
        responses: {
          200: { description: 'Lista de solicitudes pendientes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RecyclingRequest' } } } } },
        },
      },
    },
    '/requests/{id}/approve': {
      post: {
        tags: ['Requests'],
        summary: 'Docente aprueba una solicitud',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['teacher_id'],
                properties: {
                  teacher_id: { type: 'integer', example: 1 },
                  review_message: { type: 'string', example: '¡Buen trabajo!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Solicitud aprobada y puntos otorgados', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, points_awarded: { type: 'integer' }, new_level: { type: 'string' } } } } } },
          404: { description: 'Solicitud no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/requests/{id}/reject': {
      post: {
        tags: ['Requests'],
        summary: 'Docente rechaza una solicitud',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['teacher_id'],
                properties: {
                  teacher_id: { type: 'integer', example: 1 },
                  review_message: { type: 'string', example: 'La imagen no es clara.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Solicitud rechazada', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          404: { description: 'Solicitud no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ─── RANKING ───────────────────────────────────────────────
    '/ranking/students': {
      get: {
        tags: ['Ranking'],
        summary: 'Ranking de estudiantes por puntos',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Ranking de estudiantes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RankingEntry' } } } } },
        },
      },
    },
    '/ranking/teachers': {
      get: {
        tags: ['Ranking'],
        summary: 'Ranking de docentes por puntos',
        responses: {
          200: { description: 'Ranking de docentes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RankingEntry' } } } } },
        },
      },
    },
    '/ranking/parents': {
      get: {
        tags: ['Ranking'],
        summary: 'Ranking de padres por puntos',
        responses: {
          200: { description: 'Ranking de padres', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RankingEntry' } } } } },
        },
      },
    },

    // ─── BADGES ────────────────────────────────────────────────
    '/badges': {
      get: {
        tags: ['Badges'],
        summary: 'Obtener todos los badges disponibles',
        responses: {
          200: { description: 'Lista de badges', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Badge' } } } } },
        },
      },
    },
    '/badges/user/{userId}': {
      get: {
        tags: ['Badges'],
        summary: 'Badges ganados por un usuario',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Badges del usuario', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Badge' } } } } },
        },
      },
    },

    // ─── UPLOAD ────────────────────────────────────────────────
    '/upload/image': {
      post: {
        tags: ['Upload'],
        summary: 'Subir imagen en base64 a Cloudflare R2',
        description: 'Límite: 5 imágenes por usuario. Tamaño: 10KB–15MB. Formatos: JPEG, PNG, WEBP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'imageBase64', 'mimeType'],
                properties: {
                  userId: { type: 'integer', example: 1 },
                  imageBase64: { type: 'string', description: 'Imagen en base64 (sin prefijo data:image)' },
                  mimeType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp'], example: 'image/jpeg' },
                  folder: { type: 'string', example: 'evidence', description: 'Carpeta destino en R2' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'URL de la imagen subida', content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' }, key: { type: 'string' } } } } } },
          400: { description: 'Imagen inválida o límite alcanzado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/upload/count/{userId}': {
      get: {
        tags: ['Upload'],
        summary: 'Contar imágenes subidas por un usuario',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Conteo de imágenes', content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' }, limit: { type: 'integer', example: 5 }, canUpload: { type: 'boolean' } } } } } },
        },
      },
    },
  },
};

module.exports = { swaggerUi, swaggerDocument };
