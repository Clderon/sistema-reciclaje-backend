# 📋 Resumen Rápido - Sistema Reciclaje Backend

Guía rápida y directa para configurar y desplegar el backend.

---

## 🚀 Inicio Rápido

### Instalación Local

```bash
npm install
npm start
```

### Variables de Entorno (.env)

```env
# RDS
DB_HOST=sistemareciclaje.c83wgss82x4e.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=sistema_reciclaje
DB_USER=postgres
DB_PASSWORD=tu_password
DB_SSL=true

# S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
S3_BUCKET_NAME=s3-sistema-reciclaje-unas-2025

# Servidor
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

---

## ✅ Tests de Conexión

```bash
# Test RDS
npm run test:connection

# Test S3
npm run test:s3

# Diagnóstico completo
npm run diagnose
```

---

## 📦 Scripts Disponibles

```bash
npm start              # Iniciar servidor
npm run dev            # Desarrollo con nodemon
npm run db:migrate     # Crear tablas en BD
npm run db:create      # Crear base de datos
npm run test:connection # Probar RDS
npm run test:s3        # Probar S3
npm run diagnose       # Diagnóstico completo
```

---

## 🔌 Endpoints Principales

```
GET  /health                                    # Health check
POST /api/auth/login-or-register               # Login/Registro
GET  /api/users/:id                            # Obtener usuario
POST /api/recycling                            # Registrar reciclaje
GET  /api/ranking/students                     # Ranking estudiantes
GET  /api/badges                               # Listar badges
POST /api/upload/image                         # Subir imagen a S3
```

---

## 🚀 Deployment en Render

### 1. Subir a GitHub

```bash
git add .
git commit -m "Backend completo"
git push origin main
```

### 2. En Render

1. Crear Web Service
2. Conectar repositorio GitHub
3. Build: `npm install`
4. Start: `npm start`

### 3. Variables de Entorno en Render

```env
DATABASE_URL=postgresql://postgres:password@host:5432/sistema_reciclaje
DB_SSL=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_key
AWS_SECRET_ACCESS_KEY=tu_secret
S3_BUCKET_NAME=tu-bucket
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
```

### 4. Auto-Deploy

**Render detecta cambios automáticamente cuando haces `git push`**

---

## 🔧 Configuración S3

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

**⚠️ IMPORTANTE:** Desmarca "Block all public access" en Permissions.

---

## 📁 Estructura del Proyecto

```
src/
├── server.js              # Servidor principal
├── config/
│   ├── database.js        # Configuración RDS
│   └── s3.js              # Configuración S3
├── controllers/           # Lógica de negocio
├── routes/                # Rutas API
└── database/
    ├── schema.sql         # Esquema BD
    └── migrate.js         # Migraciones
```

---

## 🐛 Problemas Comunes

### RDS no conecta
- Verifica Security Group permite conexiones desde tu IP (o 0.0.0.0/0)
- Verifica credenciales en .env

### S3 error "ACL not supported"
- ✅ Ya está corregido en el código (no usa ACLs)
- Configura Bucket Policy para acceso público

### Build falla en Render
- Verifica que package.json tenga todas las dependencias
- Revisa logs en Render

---

## 📚 Documentación Completa

- `GUIA_DEPLOYMENT_COMPLETA.md` - Guía detallada de deployment
- `CONFIGURAR_S3.md` - Configuración detallada de S3
- `README.md` - Documentación completa del proyecto

---

## ✅ Checklist Pre-Deployment

- [ ] Backend funciona localmente (`npm start`)
- [ ] RDS conecta (`npm run test:connection`)
- [ ] S3 conecta (`npm run test:s3`)
- [ ] `.env` NO está en git
- [ ] Código subido a GitHub
- [ ] Variables configuradas en Render

---

## 🎯 Flujo de Trabajo

```
1. Modificar código localmente
2. git add . && git commit -m "mensaje"
3. git push
4. Render despliega automáticamente
```

---

## 📞 URLs Importantes

- **Health Check:** `http://localhost:3000/health`
- **API Base:** `http://localhost:3000/api`
- **Render Dashboard:** https://dashboard.render.com

---

**Última actualización:** Diciembre 2024

