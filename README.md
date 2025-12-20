# Sistema de Reciclaje - Backend API

Backend API para el Sistema de Reciclaje desarrollado con Node.js, Express y PostgreSQL.

## 🚀 Tecnologías

- **Node.js** + **Express** - Servidor API REST
- **PostgreSQL** - Base de datos
- **Render** - Deployment (o Railway/Heroku)

## 📁 Estructura del Proyecto

```
Sistema-Reciclaje-Backend/
├── src/
│   ├── server.js              # Servidor principal
│   ├── config/
│   │   └── database.js        # Configuración de base de datos
│   ├── controllers/           # Lógica de negocio
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── recyclingController.js
│   │   ├── rankingController.js
│   │   └── badgeController.js
│   ├── routes/                # Rutas de la API
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── recycling.js
│   │   ├── ranking.js
│   │   └── badges.js
│   └── database/
│       ├── schema.sql         # Esquema de base de datos
│       ├── seed.sql           # Datos iniciales
│       └── migrate.js         # Script de migración
├── .env.example               # Ejemplo de variables de entorno
├── package.json
└── README.md
```

## 🛠️ Instalación Local

### 1. Clonar o navegar al directorio
```bash
cd Sistema-Reciclaje-Backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sistema_reciclaje
PORT=3000
NODE_ENV=development
```

### 4. Crear base de datos PostgreSQL
```bash
# Crear base de datos
createdb sistema_reciclaje

# O con psql:
psql -U postgres
CREATE DATABASE sistema_reciclaje;
\q
```

### 5. Ejecutar migraciones
```bash
npm run db:migrate
```

### 6. Iniciar servidor
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Login de usuario existente
- `POST /api/auth/login-or-register` - Login o registro automático (recomendado)

### Usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario

### Reciclaje
- `POST /api/recycling` - Registrar nuevo reciclaje
- `GET /api/recycling/user/:userId` - Historial de reciclajes

### Ranking
- `GET /api/ranking/students` - Ranking de estudiantes
- `GET /api/ranking/teachers` - Ranking de docentes
- `GET /api/ranking/parents` - Ranking de padres

### Badges
- `GET /api/badges` - Todos los badges disponibles
- `GET /api/badges/user/:userId` - Badges de un usuario

### Health Check
- `GET /health` - Estado del servidor

## 🔌 Ejemplos de Uso

### Registrar/Login Usuario
```bash
POST /api/auth/login-or-register
Content-Type: application/json

{
  "username": "Juan Pérez",
  "role": "student"
}
```

### Registrar Reciclaje
```bash
POST /api/recycling
Content-Type: application/json

{
  "userId": 1,
  "categoryId": 1,
  "quantity": 5.5,
  "unit": "kg",
  "evidenceImageUrl": "https://..."
}
```

### Obtener Ranking
```bash
GET /api/ranking/students?limit=10
```

## 🚀 Deployment en Render

### Opción 1: Desde GitHub (Recomendado)

1. **Subir código a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/sistema-reciclaje-backend.git
   git push -u origin main
   ```

2. **Crear cuenta en Render**
   - Ir a [render.com](https://render.com)
   - Conectar con GitHub

3. **Crear Base de Datos PostgreSQL**
   - En Render Dashboard: New → PostgreSQL
   - Seleccionar plan (Free para empezar)
   - Anotar la `DATABASE_URL` que se genera

4. **Crear Web Service**
   - New → Web Service
   - Conectar repositorio GitHub
   - Configuración:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       - `DATABASE_URL`: (se copia automáticamente si vinculaste la BD)
       - `NODE_ENV`: `production`
       - `PORT`: `3000`

5. **Ejecutar migraciones**
   - Una vez desplegado, ir a la consola del servicio
   - Ejecutar: `npm run db:migrate`

### Opción 2: Con render.yaml

1. Crear servicio desde el dashboard
2. Render detectará `render.yaml` automáticamente
3. Configurar variables de entorno manualmente

## 🔒 Seguridad (Notas Futuras)

- ⚠️ **Por ahora NO hay JWT** - Se implementará después
- ⚠️ Las rutas no están protegidas todavía
- ✅ CORS configurado para permitir requests desde la app móvil
- ⚠️ En producción, limitar CORS a dominios específicos

## 📝 Variables de Entorno

```env
# Base de datos (Render lo proporciona automáticamente)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Servidor
PORT=3000
NODE_ENV=production

# CORS (opcional)
CORS_ORIGIN=https://tu-app.com
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Probar registro
```bash
curl -X POST http://localhost:3000/api/auth/login-or-register \
  -H "Content-Type: application/json" \
  -d '{"username":"Test User","role":"student"}'
```

## 📚 Próximos Pasos

- [ ] Implementar JWT para autenticación
- [ ] Agregar validación de datos con Joi o express-validator
- [ ] Implementar tests unitarios
- [ ] Agregar logging con Winston
- [ ] Configurar S3 para imágenes
- [ ] Agregar rate limiting
- [ ] Documentación con Swagger

## 🐛 Troubleshooting

### Error de conexión a base de datos
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en `.env`
- Verificar que la base de datos exista

### Error en migración
- Verificar que el usuario tenga permisos
- Verificar que las tablas no existan ya

### CORS errors
- Verificar configuración de CORS en `server.js`
- En producción, especificar dominio exacto

## 📄 Licencia

ISC

