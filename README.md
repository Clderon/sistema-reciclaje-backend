# Sistema de Reciclaje - Backend API

Backend API para el Sistema de Reciclaje desarrollado con Node.js, Express y PostgreSQL.

## 🚀 Tecnologías

- **Node.js** + **Express** - Servidor API REST
- **PostgreSQL** - Base de datos
- **Cloudflare R2** - Almacenamiento de imágenes (S3-compatible)
- **Render/Railway** - Deployment

## 📁 Estructura del Proyecto

```
Sistema-Reciclaje-Backend/
├── src/
│   ├── server.js              # Servidor principal
│   ├── config/
│   │   ├── database.js        # Configuración de base de datos
│   │   ├── s3.js              # Configuración de Cloudflare R2
│   │   └── environment.js     # Sistema de entornos (local/aws)
│   ├── controllers/           # Lógica de negocio
│   ├── routes/                # Rutas de la API
│   └── database/
│       ├── schema.sql         # Esquema principal
│       ├── migration_add_recycling_requests.sql
│       ├── migrate.js         # Script unificado de migración
│       ├── seed.js            # Datos iniciales
│       └── test-connection.js # Script de prueba de conexión
├── package.json
└── README.md
```

## 🛠️ Instalación Rápida

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar `.env`

**Para desarrollo LOCAL (PostgreSQL en Docker):**
```env
ENVIRONMENT=local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SelvaGO
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Almacenamiento deshabilitado en local
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

**Para producción con Supabase + Cloudflare R2:**
```env
ENVIRONMENT=aws
DATABASE_URL=postgresql://postgres:[tu-password]@[tu-proyecto].supabase.co:5432/postgres

# Cloudflare R2
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_REGION=auto
R2_BUCKET_NAME=selva-go
R2_ENDPOINT=https://[tu-account-id].r2.cloudflarestorage.com

PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
```

**Nota:** El código detecta automáticamente si es Supabase (por la URL) y configura SSL correctamente. Solo necesitas la `DATABASE_URL` de Supabase.

### 3. Configurar servicios locales

**PostgreSQL en Docker:**
```bash
docker run --name selvago_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=SelvaGO -p 5432:5432 -d postgres:16
```

### 4. Ejecutar migraciones y seeds

```bash
# Crear estructura de base de datos
npm run db:migrate

# Insertar datos iniciales (badges, profesores, estudiantes)
npm run db:seed
```

### 5. Probar conexión

```bash
# Probar entorno local
npm run test:connection:local

# Probar conexión con R2
npm run test:connection:r2
```

### 6. Iniciar servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## ☁️ Configurar Cloudflare R2

### Paso 1: Obtener credenciales

1. Ve a: https://dash.cloudflare.com/?to=/:account/r2/api-tokens
2. Click en **"Create API token"**
3. Configura:
   - **Permissions:** "Object Read & Write"
   - **Bucket access:** "Allow access to specific buckets" → Selecciona **"selva-go"**
4. **Copia AMBAS credenciales** (solo se muestran una vez):
   - **Access Key ID**
   - **Secret Access Key**

### Paso 2: Obtener endpoint

1. Ve a tu bucket **"selva-go"** en R2
2. Click en **"Settings"**
3. Busca **"S3 API"** y copia el endpoint
4. Formato: `https://[account-id].r2.cloudflarestorage.com`

### Paso 3: Actualizar `.env`

```env
ENVIRONMENT=aws
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_REGION=auto
R2_BUCKET_NAME=selva-go
R2_ENDPOINT=https://[tu-account-id].r2.cloudflarestorage.com
```

### Paso 4: Verificar

```bash
npm run test:connection:r2
```

## 🔧 Sistema de Entornos

- **LOCAL**: PostgreSQL en Docker (sin almacenamiento de imágenes)
- **AWS**: PostgreSQL en RDS + Cloudflare R2 para imágenes

Para cambiar de entorno, modifica `ENVIRONMENT=local` o `ENVIRONMENT=aws` en tu `.env`.

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Login de usuario existente
- `POST /api/auth/login-or-register` - Login o registro automático

### Usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario

### Reciclaje
- `POST /api/recycling` - Registrar nuevo reciclaje
- `GET /api/recycling/user/:userId` - Historial de reciclajes

### Requests (Peticiones de revisión)
- `POST /api/requests` - Crear petición de revisión
- `GET /api/requests` - Listar peticiones (profesores)
- `PUT /api/requests/:id/review` - Revisar petición (aprobar/rechazar)

### Ranking
- `GET /api/ranking/students` - Ranking de estudiantes
- `GET /api/ranking/teachers` - Ranking de docentes
- `GET /api/ranking/parents` - Ranking de padres

### Badges
- `GET /api/badges` - Todos los badges disponibles
- `GET /api/badges/user/:userId` - Badges de un usuario

### Health Check
- `GET /health` - Estado del servidor

## 📝 Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo (con nodemon)
- `npm run db:migrate` - Ejecutar migraciones (crea estructura/tablas)
- `npm run db:seed` - Ejecutar seed (inserta datos iniciales)
- `npm run test:connection` - Probar conexión (entorno actual)
- `npm run test:connection:local` - Probar conexión LOCAL
- `npm run test:connection:r2` - Probar conexión con Cloudflare R2

## 🚀 Deployment en Render

### 1. Preparar código

Asegúrate de que `.env` esté en `.gitignore` (no commits credenciales).

### 2. Crear cuenta en Render

- Ir a [render.com](https://render.com)
- Conectar con GitHub

### 3. Crear Base de Datos PostgreSQL

- En Render Dashboard: New → PostgreSQL
- Seleccionar plan (Free para empezar)
- Anotar la `DATABASE_URL` que se genera

### 4. Crear Web Service

- New → Web Service
- Conectar repositorio GitHub
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 5. Configurar Variables de Entorno

En Render Dashboard → Environment:
```env
ENVIRONMENT=aws
DATABASE_URL=postgresql://... (de Render)
DB_SSL=true
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*

# Cloudflare R2
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_REGION=auto
R2_BUCKET_NAME=selva-go
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
```

### 6. Ejecutar migraciones

En Render Dashboard → Shell del servicio:
```bash
npm run db:migrate
npm run db:seed
```

### 7. Auto-Deploy

Render hará auto-deploy en cada push a la rama principal.

## ⚠️ Notas Importantes

- El archivo `.env` NO debe subirse a Git
- Las credenciales de R2 solo se muestran una vez al crear el token
- En modo LOCAL, el almacenamiento está deshabilitado (usa R2 para desarrollo con móviles)
- Cloudflare R2 tiene un tier gratuito generoso (10GB almacenamiento, 1M operaciones/mes)
