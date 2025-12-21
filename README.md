# Sistema de Reciclaje - Backend API

Backend API para el Sistema de Reciclaje desarrollado con Node.js, Express y PostgreSQL.

## 🚀 Tecnologías

- **Node.js** + **Express** - Servidor API REST
- **PostgreSQL** - Base de datos
- **AWS S3** - Almacenamiento de imágenes
- **Render/Railway** - Deployment

## 📁 Estructura del Proyecto

```
Sistema-Reciclaje-Backend/
├── src/
│   ├── server.js              # Servidor principal
│   ├── config/
│   │   ├── database.js        # Configuración de base de datos
│   │   ├── s3.js              # Configuración de S3
│   │   └── environment.js     # Sistema de entornos (local/aws)
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
│       ├── schema.sql         # Esquema principal
│       ├── migration_add_recycling_requests.sql
│       ├── seed.sql           # Datos iniciales
│       ├── migrate.js         # Script unificado de migración
│       └── test-connection.js # Script de prueba de conexión
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

Crear archivo `.env` en la raíz del proyecto:

**Para desarrollo LOCAL (Docker PostgreSQL + MinIO):**
```env
ENVIRONMENT=local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SelvaGO
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# MinIO (alternativa local a S3)
USE_MINIO=true
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=selvago

PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

**Nota:** Si no quieres usar MinIO en local, establece `USE_MINIO=false` y el almacenamiento estará deshabilitado.

**Para producción AWS (RDS + S3):**
```env
ENVIRONMENT=aws
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db
DB_SSL=true

AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=nombre-del-bucket

PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
```

### 4. Configurar servicios locales con Docker

#### PostgreSQL (Base de datos)
```bash
docker run --name selvago_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=SelvaGO -p 5432:5432 -d postgres:16
```

#### MinIO (Almacenamiento de archivos - alternativa a S3)

MinIO es compatible con la API de S3, perfecto para desarrollo local:

```bash
docker run --name minio_reciclaje -p 9000:9000 -p 9001:9001 -e "MINIO_ROOT_USER=minioadmin" -e "MINIO_ROOT_PASSWORD=minioadmin" -v minio_data:/data -d minio/minio server /data --console-address ":9001"
```

**Acceder a MinIO Console:**
- URL: http://localhost:9001
- Usuario: `minioadmin`
- Contraseña: `minioadmin`

**Crear bucket en MinIO:**
1. Ir a http://localhost:9001
2. Login con las credenciales
3. Crear un bucket llamado `selvago` (o el nombre que configuraste en `MINIO_BUCKET_NAME`)
4. Configurar el bucket como público (opcional, para acceso directo)

**Para iniciar los contenedores después:**
```bash
docker start selvago_db
docker start minio_reciclaje
```

### 5. Ejecutar migraciones y seeds

**Migración (solo estructura/tablas):**
```bash
npm run db:migrate
```

Este comando crea la estructura de la base de datos:
1. Schema principal (`schema.sql`) - Crea todas las tablas base
2. Migraciones adicionales (`migration_add_recycling_requests.sql`) - Modificaciones de estructura

**Seed (datos iniciales):**
```bash
npm run db:seed
```

Este comando inserta datos iniciales:
1. Badges/logros iniciales
2. Profesores de prueba

### 6. Probar conexión

El test de conexión verifica que PostgreSQL y MinIO estén funcionando correctamente:

```bash
# Probar con entorno actual del .env
npm run test:connection

# Probar específicamente modo LOCAL
npm run test:connection:local

# Probar específicamente modo AWS
npm run test:connection:aws
```

**El test mostrará:**
- ✅ Estado de conexión a PostgreSQL
- ✅ Estado de conexión a MinIO (si está habilitado)
- 💡 Sugerencias para resolver problemas si hay errores
- 📊 Resumen de todas las conexiones

**Si alguna conexión falla, el test te indicará:**
- Qué contenedores Docker necesitas iniciar
- Comandos para crear los contenedores si no existen
- Cómo verificar el estado de los servicios

### 7. Iniciar servidor
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 🔧 Sistema de Entornos

El sistema permite trabajar con dos entornos:

### LOCAL
- **Base de datos:** PostgreSQL en Docker local
- **Almacenamiento:** MinIO 

### AWS
- **Base de datos:** AWS RDS PostgreSQL
- **Almacenamiento:** AWS S3 para imágenes
- Ideal para producción

**MinIO** es una alternativa local a S3 que:
- ✅ Es compatible con la API de S3 (mismo código funciona)
- ✅ Se ejecuta en Docker
- ✅ Perfecto para desarrollo y testing
- ✅ No requiere configuración de AWS

Para cambiar de entorno, solo modifica `ENVIRONMENT=local` o `ENVIRONMENT=aws` en tu `.env`.

Para usar MinIO en local, configura `USE_MINIO=true` (por defecto está activado).

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

### Requests
- `POST /api/requests` - Crear petición de revisión
- `GET /api/requests` - Listar peticiones
- `PUT /api/requests/:id/review` - Revisar petición

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

## 📝 Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo (con nodemon)
- `npm run db:migrate` - Ejecutar migraciones (crea estructura/tablas)
- `npm run db:seed` - Ejecutar seed (inserta datos iniciales: badges y profesores)
- `npm run test:connection` - Probar conexión (entorno actual)
- `npm run test:connection:local` - Probar conexión LOCAL
- `npm run test:connection:aws` - Probar conexión AWS

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
   ⚠️ **Importante**: Asegúrate de que `.env` esté en `.gitignore` (no commits credenciales)

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
       - `ENVIRONMENT=aws`
       - `DATABASE_URL`: (copiar desde la BD creada)
       - `DB_SSL=true`
       - `NODE_ENV=production`
       - `PORT=3000`
       - Variables de AWS S3 si aplica:
         - `AWS_REGION=us-east-1`
         - `AWS_ACCESS_KEY_ID=...`
         - `AWS_SECRET_ACCESS_KEY=...`
         - `S3_BUCKET_NAME=...`

5. **Ejecutar migraciones**
   - Una vez desplegado, ir a la consola del servicio
   - Ejecutar: `npm run db:migrate`

6. **Auto-Deploy**
   - Render detecta cambios automáticamente cuando haces `git push`

### Opción 2: Con render.yaml

1. Crear servicio desde el dashboard
2. Render detectará `render.yaml` automáticamente
3. Configurar variables de entorno manualmente

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Probar conexión a base de datos
```bash
npm run test:connection
```

### Probar registro
```bash
curl -X POST http://localhost:3000/api/auth/login-or-register \
  -H "Content-Type: application/json" \
  -d '{"username":"Test User","role":"student"}'
```

## 🔒 Seguridad

- ⚠️ **Por ahora NO hay JWT** - Se implementará después
- ⚠️ Las rutas no están protegidas todavía
- ✅ CORS configurado para permitir requests desde la app móvil
- ⚠️ En producción, limitar CORS a dominios específicos
- ⚠️ **Nunca commits credenciales reales** al repositorio

## 🐛 Troubleshooting

### Error de conexión a base de datos
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en `.env`
- Verificar que la base de datos exista
- Verificar que `ENVIRONMENT` esté configurado correctamente
- **Para AWS RDS**: Verificar Security Group permite conexiones desde tu IP (o 0.0.0.0/0)

### Error en migración
- Verificar que el usuario tenga permisos
- Verificar que las tablas no existan ya
- Probar conexión primero: `npm run test:connection`

### CORS errors
- Verificar configuración de CORS en `server.js`
- En producción, especificar dominio exacto en `CORS_ORIGIN`

### MinIO/S3 no funciona en LOCAL
- Verifica que MinIO esté corriendo: `docker ps` debe mostrar `minio_reciclaje`
- Verifica que el puerto 9000 esté disponible
- Verifica las credenciales en `.env` (MINIO_ACCESS_KEY, MINIO_SECRET_KEY)
- Verifica que el bucket exista en MinIO Console (http://localhost:9001)
- Si no quieres usar MinIO, establece `USE_MINIO=false` en `.env`

### Error "Network request failed" en el frontend

Si el frontend no puede conectarse al backend local, verifica:

1. **Backend está corriendo**: Asegúrate de que `npm run dev` esté ejecutándose
2. **Misma red WiFi**: Tu dispositivo móvil debe estar en la misma red WiFi que tu computadora
3. **IP correcta**: Verifica que la IP en `Sistema-Reciclaje-React/src/config/api.js` sea tu IP local (obtener con `ipconfig` en Windows)
4. **Firewall de Windows**: El firewall puede estar bloqueando el puerto 3000

**Solución rápida - Abrir puerto en Firewall:**

```powershell
# Ejecutar como Administrador en PowerShell
cd Sistema-Reciclaje-Backend
PowerShell -ExecutionPolicy Bypass -File .\abrir-puerto-firewall.ps1
```

O manualmente:
1. Abre "Firewall de Windows Defender" → "Configuración avanzada"
2. Reglas de entrada → Nueva regla
3. Puerto → TCP → 3000 → Permitir conexión
4. Nombre: "Sistema Reciclaje Backend - Puerto 3000"

**Verificar que el backend responde:**
```bash
# Desde tu computadora
curl http://localhost:3000/health

# Desde tu dispositivo móvil (misma red WiFi)
# Abre el navegador y ve a: http://TU_IP_LOCAL:3000/health
# Debe mostrar: {"status":"ok","message":"Sistema de Reciclaje API is running",...}
```

### S3 error "ACL not supported" o acceso denegado
- Configurar Bucket Policy para acceso público en AWS Console
- Desmarcar "Block all public access" en Permissions del bucket
- Verificar que las credenciales AWS sean correctas

### Build falla en Render
- Verificar que `package.json` tenga todas las dependencias
- Revisar logs en Render Dashboard
- Verificar que todas las variables de entorno estén configuradas

## ☁️ Almacenamiento de Archivos

### MinIO (Local)

MinIO es la alternativa local a S3. Para configurarlo:

1. **Ejecutar MinIO con Docker:**
   ```bash
   docker run --name minio_reciclaje \
     -p 9000:9000 \
     -p 9001:9001 \
     -e "MINIO_ROOT_USER=minioadmin" \
     -e "MINIO_ROOT_PASSWORD=minioadmin" \
     -v minio_data:/data \
     -d minio/minio server /data --console-address ":9001"
   ```

2. **Configurar en `.env`:**
   ```env
   USE_MINIO=true
   MINIO_ENDPOINT=http://localhost:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET_NAME=selvago
   ```

3. **Crear bucket en MinIO Console:**
   - Ir a http://localhost:9001
   - Login y crear el bucket `selvago`
   - El sistema también puede crearlo automáticamente

### AWS S3 (Producción)

Si usas S3 en producción para almacenar imágenes, configura el bucket:

### Bucket Policy (para acceso público)

En AWS Console → S3 → Tu bucket → Permissions → Bucket Policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::TU_BUCKET_NAME/*"
        }
    ]
}
```

**⚠️ IMPORTANTE:** Desmarca "Block all public access" en Permissions → Public access settings.

## ✅ Checklist Pre-Deployment

- [ ] Backend funciona localmente (`npm start`)
- [ ] Conexión a base de datos funciona (`npm run test:connection`)
- [ ] Migraciones ejecutadas (`npm run db:migrate`)
- [ ] `.env` NO está en git (verificar `.gitignore`)
- [ ] Código subido a GitHub
- [ ] Variables de entorno configuradas en Render
- [ ] Health check funciona: `GET /health`

## 📚 Próximos Pasos

- [ ] Implementar JWT para autenticación
- [ ] Agregar validación de datos con Joi o express-validator
- [ ] Implementar tests unitarios
- [ ] Agregar logging con Winston
- [ ] Agregar rate limiting
- [ ] Documentación con Swagger

## 📄 Licencia

ISC
