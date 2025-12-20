# 🚀 Guía Completa de Deployment - Sistema Reciclaje Backend

Esta guía incluye todos los pasos desde la verificación local hasta el deployment en Render y configuración del frontend.

---

## 📋 ÍNDICE

1. [Verificación Pre-Deployment](#1-verificación-pre-deployment)
2. [Preparación para GitHub](#2-preparación-para-github)
3. [Deployment en Render](#3-deployment-en-render)
4. [Configuración Post-Deployment](#4-configuración-post-deployment)
5. [Configuración del Frontend](#5-configuración-del-frontend)
6. [Verificación Final](#6-verificación-final)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. VERIFICACIÓN PRE-DEPLOYMENT

### 1.1 Backend Funciona Localmente

```bash
cd Sistema-Reciclaje-Backend
npm install
npm start
```

**Verificar en consola:**
- ✅ `Conexión exitosa a PostgreSQL`
- ✅ `Servidor corriendo en puerto 3000`
- ✅ `Health check: http://localhost:3000/health`

**Probar health check:**
```bash
# PowerShell
curl http://localhost:3000/health

# O desde navegador
http://localhost:3000/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "message": "Sistema de Reciclaje API is running",
  "timestamp": "..."
}
```

---

### 1.2 Probar Endpoints

**Test de registro/login:**
```bash
curl -X POST http://localhost:3000/api/auth/login-or-register -H "Content-Type: application/json" -d "{\"username\":\"Test User\",\"role\":\"student\"}"
```

**Verificar respuesta:**
```json
{
  "message": "Usuario creado y logueado exitosamente",
  "user": {
    "id": 1,
    "username": "Test User",
    "role": "student",
    "totalPoints": 0,
    ...
  }
}
```

---

### 1.3 Verificar Base de Datos

```bash
npm run diagnose
```

**Verificar:**
- ✅ DNS resuelve correctamente
- ✅ Conexión CON SSL exitosa
- ✅ Base de datos `sistema_reciclaje` existe
- ✅ Tablas creadas (si no, ejecutar `npm run db:migrate`)

**Crear base de datos si falta:**
```bash
npm run db:create
```

**Ejecutar migraciones si faltan tablas:**
```bash
npm run db:migrate
```

---

### 1.4 Variables de Entorno

Verificar que `.env` tenga (para referencia, NO subir a GitHub):

```env
# Opción 1: DATABASE_URL completa
DATABASE_URL=postgresql://postgres:PASSWORD@sistemareciclaje.c83wgss82x4e.us-east-1.rds.amazonaws.com:5432/sistema_reciclaje
DB_SSL=true

# Opción 2: Variables separadas
DB_HOST=sistemareciclaje.c83wgss82x4e.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=sistema_reciclaje
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_RDS
DB_SSL=true

# Opcionales
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
```

---

### 1.5 Verificar Código

- [ ] `package.json` tiene todos los scripts necesarios
- [ ] No hay errores de sintaxis
- [ ] `.gitignore` excluye `.env` y `node_modules`
- [ ] `src/server.js` existe y funciona

---

## 2. PREPARACIÓN PARA GITHUB

### 2.1 Verificar .gitignore

Asegúrate de que `.gitignore` incluya:
```
node_modules/
.env
.env.local
*.log
```

### 2.2 Inicializar Git (si no está inicializado)

```bash
cd Sistema-Reciclaje-Backend
git init
git add .
git commit -m "Initial commit - Backend Sistema Reciclaje"
```

### 2.3 Subir a GitHub

**Crear repositorio en GitHub:**
1. Ve a [github.com](https://github.com)
2. Click "New repository"
3. Nombre: `sistema-reciclaje-backend`
4. Público o Privado (tu elección)
5. NO inicializar con README

**Conectar y subir:**
```bash
git remote add origin https://github.com/TU_USUARIO/sistema-reciclaje-backend.git
git branch -M main
git push -u origin main
```

**Verificar que .env NO está en GitHub:**
```bash
# Verificar qué archivos están en git
git ls-files | grep env

# No debería mostrar .env
```

---

## 3. DEPLOYMENT EN RENDER

### 3.1 Crear Cuenta en Render

1. Ve a [render.com](https://render.com)
2. Click "Get Started for Free"
3. Conecta con GitHub (recomendado) o crea cuenta con email

### 3.2 Crear Web Service

1. En el dashboard de Render, click "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio de GitHub:
   - Si es la primera vez, autoriza Render
   - Selecciona el repositorio `sistema-reciclaje-backend`
   - Click "Connect"

### 3.3 Configuración del Servicio

**Configuración básica:**
- **Name:** `sistema-reciclaje-api` (o el que prefieras)
- **Region:** Elige el más cercano a ti
- **Branch:** `main`
- **Root Directory:** (dejar vacío, código está en raíz)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** `Free` (para empezar)

### 3.4 Configurar Variables de Entorno

En la sección "Environment Variables", agrega:

**Variables Requeridas:**

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@sistemareciclaje.c83wgss82x4e.us-east-1.rds.amazonaws.com:5432/sistema_reciclaje
DB_SSL=true
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
```

**⚠️ IMPORTANTE:**
- No uses comillas en las variables de Render
- Reemplaza `TU_PASSWORD` con tu contraseña real de RDS
- `DATABASE_URL` debe tener formato completo: `postgresql://user:password@host:port/database`

**Si prefieres variables separadas (alternativa):**

```env
DB_HOST=sistemareciclaje.c83wgss82x4e.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=sistema_reciclaje
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_RDS
DB_SSL=true
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
```

**Variables Opcionales (si usas S3):**

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
S3_BUCKET_NAME=tu-bucket-name
```

### 3.5 Desplegar

1. Click en "Create Web Service"
2. Render comenzará a construir el servicio
3. Observa los logs en tiempo real
4. Espera a que termine (2-5 minutos)

**Logs esperados:**
```
✅ Conexión exitosa a PostgreSQL
🚀 Servidor corriendo en puerto 3000
📡 Ambiente: production
```

### 3.6 Obtener URL del Servicio

Una vez desplegado, Render te dará una URL como:
```
https://sistema-reciclaje-api.onrender.com
```

**⚠️ GUARDA ESTA URL** - La necesitarás para el frontend.

---

## 4. CONFIGURACIÓN POST-DEPLOYMENT

### 4.1 Verificar Health Check

```bash
curl https://sistema-reciclaje-api.onrender.com/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "message": "Sistema de Reciclaje API is running",
  "timestamp": "..."
}
```

### 4.2 Probar Endpoint

```bash
curl -X POST https://sistema-reciclaje-api.onrender.com/api/auth/login-or-register -H "Content-Type: application/json" -d "{\"username\":\"Test User\",\"role\":\"student\"}"
```

Deberías recibir respuesta JSON con el usuario.

### 4.3 Verificar Logs en Render

1. Ve a tu servicio en Render
2. Click en "Logs"
3. Verifica que veas:
   - ✅ `Conexión exitosa a PostgreSQL`
   - ✅ `Servidor corriendo en puerto 3000`
   - ✅ No hay errores de conexión

### 4.4 Verificar Conexión a RDS

**Si hay errores de conexión:**
1. Verifica Security Group de RDS en AWS
2. Debe permitir conexiones desde cualquier IP (temporalmente):
   - Type: PostgreSQL
   - Port: 5432
   - Source: `0.0.0.0/0`

**Para verificar Security Group:**
1. AWS Console → RDS → Tu instancia
2. Connectivity & security → Security Group
3. Inbound rules → Debe tener regla para PostgreSQL (5432)

### 4.5 Ejecutar Migraciones (si es necesario)

Si las tablas no existen en RDS:

**Opción 1: Desde Render Shell**
1. Ve a tu servicio en Render
2. Click en "Shell"
3. Ejecuta: `npm run db:migrate`

**Opción 2: Desde tu PC local**
```bash
cd Sistema-Reciclaje-Backend
npm run db:migrate
```

---

## 5. CONFIGURACIÓN DEL FRONTEND

### 5.1 Obtener URL del Backend

Anota la URL que te dio Render:
```
https://sistema-reciclaje-api.onrender.com
```

La URL completa de la API será:
```
https://sistema-reciclaje-api.onrender.com/api
```

### 5.2 Configurar Frontend

**Opción A: Variable de Entorno (Recomendado)**

1. Ve a `Sistema-Reciclaje-React/`
2. Crea archivo `.env` (si no existe)
3. Agrega:
```env
EXPO_PUBLIC_API_URL=https://sistema-reciclaje-api.onrender.com/api
```
4. Reinicia la app de Expo

**Opción B: Cambiar en Código**

1. Ve a `Sistema-Reciclaje-React/src/config/api.js`
2. Busca la línea:
```javascript
const URL_PRODUCCION = 'https://tu-backend.onrender.com/api';
```
3. Cambia a tu URL:
```javascript
const URL_PRODUCCION = 'https://sistema-reciclaje-api.onrender.com/api';
```

### 5.3 Instalar Dependencias del Frontend

```bash
cd Sistema-Reciclaje-React
npm install
```

Esto instalará `@react-native-async-storage/async-storage` si no está.

---

## 6. VERIFICACIÓN FINAL

### 6.1 Backend Desplegado

- [ ] Health check funciona: `curl https://xxx.onrender.com/health`
- [ ] Endpoint de login funciona
- [ ] Logs muestran conexión a RDS exitosa
- [ ] No hay errores en logs

### 6.2 Frontend Configurado

- [ ] URL del backend configurada (variable de entorno o código)
- [ ] Dependencias instaladas
- [ ] App inicia sin errores

### 6.3 Flujo Completo Funcionando

1. **Abre la app** en tu dispositivo/emulador
2. **Escribe un nombre** en el campo de login
3. **Selecciona un rol** (Alumno, Docente, Padre)
4. **Observa la consola del backend** (Render logs) - Deberías ver queries SQL
5. **La app debería navegar** a la pantalla principal
6. **Verifica en RDS** que el usuario se creó:
   - Conéctate a RDS y ejecuta: `SELECT * FROM users;`

---

## 7. TROUBLESHOOTING

### Error: "could not connect to server" en Render

**Causa:** Security Group de RDS bloquea conexiones

**Solución:**
1. AWS Console → RDS → Tu instancia
2. Security Group → Inbound Rules
3. Agregar regla:
   - Type: PostgreSQL
   - Port: 5432
   - Source: `0.0.0.0/0` (temporalmente)

### Error: "database does not exist"

**Causa:** Base de datos no existe en RDS

**Solución:**
```bash
# Desde tu PC local (conectado a RDS)
cd Sistema-Reciclaje-Backend
npm run db:create
npm run db:migrate
```

### Error: Build failed en Render

**Causa:** Error en código o dependencias

**Solución:**
1. Revisar logs de build en Render
2. Verificar que `package.json` esté correcto
3. Verificar que no haya errores de sintaxis
4. Probar localmente primero: `npm install && npm start`

### Error: "Network request failed" en Frontend

**Causa:** URL incorrecta o backend no disponible

**Solución:**
1. Verificar que el backend esté corriendo en Render (ver logs)
2. Verificar URL en `src/config/api.js` o `.env`
3. Probar health check: `curl https://xxx.onrender.com/health`
4. Si usas dispositivo físico, asegúrate de usar URL de Render (no localhost)

### El servicio se "duerme" (Free plan)

**Causa:** Plan gratuito de Render duerme servicios después de 15 min de inactividad

**Solución:**
- Primera petición después del sleep puede tardar ~30 segundos (es normal)
- Considerar upgrade a plan pago para producción
- O usar Railway que tiene mejor plan gratuito

### CORS Error

**Causa:** CORS no configurado correctamente

**Solución:**
1. Verificar variable `CORS_ORIGIN` en Render
2. Para desarrollo: `CORS_ORIGIN=*`
3. Para producción: especificar dominio exacto

---

## 📊 RESUMEN DEL FLUJO COMPLETO

```
1. Verificar backend local ✅
   ↓
2. Subir a GitHub ✅
   ↓
3. Crear servicio en Render ✅
   ↓
4. Configurar variables de entorno ✅
   ↓
5. Deploy en Render ✅
   ↓
6. Verificar deployment ✅
   ↓
7. Configurar frontend ✅
   ↓
8. Probar flujo completo ✅
```

---

## ✅ CHECKLIST FINAL

**Backend:**
- [ ] Funciona localmente
- [ ] Código en GitHub
- [ ] Desplegado en Render
- [ ] Health check funciona
- [ ] Endpoints funcionan
- [ ] Conexión a RDS funciona
- [ ] Logs sin errores

**Frontend:**
- [ ] URL del backend configurada
- [ ] App inicia sin errores
- [ ] Login funciona
- [ ] Usuarios se crean en RDS
- [ ] Navegación funciona

**Base de Datos:**
- [ ] RDS disponible
- [ ] Security Group configurado
- [ ] Base de datos creada
- [ ] Tablas creadas (migraciones ejecutadas)
- [ ] Usuarios se pueden crear

---

## 🎉 ¡LISTO!

Tu backend está desplegado y funcionando. El frontend puede conectarse y crear usuarios en RDS.

**URL del backend:** `https://sistema-reciclaje-api.onrender.com`  
**URL de la API:** `https://sistema-reciclaje-api.onrender.com/api`

---

## 📝 NOTAS IMPORTANTES

1. **Security Group de RDS:** Para producción, considera usar IPs específicas en lugar de `0.0.0.0/0`
2. **Plan Gratuito:** El servicio puede "dormirse" después de inactividad. Primera petición puede tardar ~30 segundos
3. **Variables de Entorno:** Nunca subas `.env` a GitHub. Siempre usa variables de entorno en Render
4. **Logs:** Revisa logs regularmente en Render para detectar problemas
5. **Backup:** Considera hacer backups regulares de tu base de datos RDS

---

## 📚 ARCHIVOS RELACIONADOS

- `README.md` - Documentación general del backend
- `CONFIGURACION_RDS.md` - Configuración detallada de RDS
- `CONEXION_EXPO.md` - Detalles sobre conexión con Expo Go

