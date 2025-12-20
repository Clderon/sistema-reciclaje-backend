# 📦 Configuración de AWS S3

Esta guía te ayuda a configurar S3 para almacenar imágenes de evidencias de reciclaje.

---

## 📋 Requisitos Previos

Necesitas tener:

1. **Cuenta de AWS** (si no tienes, créala en [aws.amazon.com](https://aws.amazon.com))
2. **Bucket de S3 creado** (o crear uno nuevo)
3. **Credenciales de acceso** (Access Key ID y Secret Access Key)

---

## 🎯 Paso 1: Crear Bucket en S3

### 1.1 Crear Bucket

1. Ve a [AWS Console](https://console.aws.amazon.com) → S3
2. Click "Create bucket"
3. Configuración:
   - **Bucket name:** `sistema-reciclaje-evidencias` (o el nombre que prefieras)
   - **Region:** `us-east-1` (o la misma región que tu RDS)
   - **Block Public Access:** Desmarcar "Block all public access" (necesitamos acceso público)
   - Aceptar advertencia
   - **Bucket Versioning:** Deshabilitado (por ahora)
   - Click "Create bucket"

### 1.2 Configurar Permisos Públicos (Bucket Policy)

**IMPORTANTE:** Buckets nuevos de AWS no permiten ACLs. Debemos usar Bucket Policy.

1. Click en tu bucket
2. Ve a la pestaña "Permissions"
3. En "Block public access (bucket settings)", click "Edit"
4. **Desmarca "Block all public access"** (necesario para acceso público)
5. Guarda cambios (acepta la advertencia)

6. En "Bucket Policy", click "Edit" y agrega:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::TU_BUCKET_NAME/*"
        }
    ]
}
```
Reemplaza `TU_BUCKET_NAME` con el nombre de tu bucket.

5. En "CORS", click "Edit" y agrega:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

---

## 🎯 Paso 2: Crear Usuario IAM para S3

### 2.1 Crear Usuario

1. Ve a AWS Console → IAM → Users
2. Click "Create user"
3. Nombre: `sistema-reciclaje-s3-user`
4. Click "Next"

### 2.2 Agregar Política

1. Click "Attach policies directly"
2. Busca y selecciona: `AmazonS3FullAccess` (o crea una política personalizada más restrictiva)
3. Click "Next" → "Create user"

### 2.3 Crear Access Keys

1. Click en el usuario creado
2. Pestaña "Security credentials"
3. Click "Create access key"
4. Selecciona "Application running outside AWS"
5. Click "Next" → "Create access key"
6. **¡IMPORTANTE!** Copia:
   - **Access Key ID**
   - **Secret Access Key** (solo se muestra una vez)

---

## 🎯 Paso 3: Configurar Variables de Entorno

En tu archivo `.env` del backend, agrega:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key_id_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_access_key_aqui
S3_BUCKET_NAME=tu-bucket-name
```

**⚠️ IMPORTANTE:**
- NO subas el archivo `.env` a GitHub
- Estas credenciales son secretas
- En Render, agrega estas variables en "Environment Variables"

---

## 🎯 Paso 4: Probar Conexión

### 4.1 Instalar Dependencias

```bash
cd Sistema-Reciclaje-Backend
npm install
```

### 4.2 Probar Conexión

```bash
npm run test:s3
```

Deberías ver:
```
✅ Todas las variables están presentes
✅ Conexión a S3 exitosa. Bucket: tu-bucket-name
✅ Conexión a S3 exitosa!
```

### 4.3 Si hay errores

**Error: "bucket does not exist"**
- Verifica que el nombre del bucket sea correcto
- Verifica que esté en la misma región

**Error: "Access Denied"**
- Verifica que las credenciales sean correctas
- Verifica que el usuario IAM tenga permisos de S3

**Error: "CredentialsError"**
- Verifica que AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY sean correctas
- Verifica que no tengan espacios extra

---

## 🎯 Paso 5: Probar Endpoint de Upload

### 5.1 Iniciar Servidor

```bash
npm start
```

### 5.2 Probar con curl

Primero, convierte una imagen a base64:

```bash
# En PowerShell (Windows)
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("ruta/a/tu/imagen.jpg"))
$dataUri = "data:image/jpeg;base64,$base64"
```

Luego, prueba el endpoint:

```bash
curl -X POST http://localhost:3000/api/upload/image \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$dataUri\",\"fileName\":\"test.jpg\"}"
```

Deberías recibir:
```json
{
  "success": true,
  "imageUrl": "https://tu-bucket.s3.amazonaws.com/recycling-evidence/1234567890-test.jpg",
  "message": "Imagen subida exitosamente"
}
```

---

## 🎯 Paso 6: Verificar en S3

1. Ve a AWS Console → S3 → Tu bucket
2. Deberías ver una carpeta `recycling-evidence/`
3. Dentro deberías ver las imágenes subidas

---

## 📝 Uso en React Native

El servicio `uploadService.js` ya está creado. Para usarlo:

```javascript
import { uploadImage } from '../services/uploadService';

// Cuando tengas una imagen desde ImagePicker
const imageUri = result.assets[0].uri; // URI local de la imagen

// Subir a S3
const uploadResult = await uploadImage(imageUri, 'evidencia.jpg');

if (uploadResult.success) {
  const imageUrl = uploadResult.imageUrl; // URL pública en S3
  // Usar imageUrl al registrar reciclaje
}
```

---

## ✅ Checklist de Configuración

- [ ] Bucket de S3 creado
- [ ] Permisos públicos configurados
- [ ] CORS configurado
- [ ] Usuario IAM creado
- [ ] Access Keys creadas y guardadas
- [ ] Variables de entorno configuradas en `.env`
- [ ] `npm install` ejecutado
- [ ] `npm run test:s3` pasa exitosamente
- [ ] Endpoint `/api/upload/image` funciona
- [ ] Imagen aparece en el bucket S3

---

## 🔒 Seguridad

### Recomendaciones:

1. **Política IAM Restrictiva:**
   En lugar de `AmazonS3FullAccess`, crea una política personalizada:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::TU_BUCKET_NAME/*"
        }
    ]
}
```

2. **Rotar Credenciales:**
   Cambia las access keys periódicamente

3. **No Exponer en Frontend:**
   Nunca pongas las credenciales en el código del frontend
   Todo pasa por el backend

---

## 💰 Costos

S3 es muy barato para almacenamiento:
- **Storage:** ~$0.023 por GB/mes
- **Requests:** ~$0.0004 por 1000 requests PUT
- **Data Transfer:** Primeros 100GB gratis/mes

Para una app pequeña, probablemente estés en el tier gratuito o menos de $1/mes.

---

## 🎉 ¡Listo!

Una vez configurado, puedes:
- ✅ Subir imágenes desde React Native
- ✅ Almacenarlas en S3
- ✅ Obtener URLs públicas
- ✅ Usar esas URLs al registrar reciclajes

