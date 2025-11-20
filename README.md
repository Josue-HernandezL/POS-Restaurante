# POS Restaurant API

API REST para sistema de punto de venta de restaurante usando Express y Firebase.

## 📋 Tabla de Contenidos

- [Configuración Inicial](#configuración-inicial)
- [Endpoints de Autenticación](#endpoints-de-autenticación)
- [Roles Disponibles](#roles-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)

## Configuración Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase
- Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
- Ve a **Project Settings → Service Accounts**
- Haz clic en **"Generar nueva clave privada"**
- Guarda el archivo JSON descargado como `serviceAccountKey.json` en la raíz del proyecto
- Ve a **Firestore Database** y haz clic en **"Crear base de datos"**

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz con:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRE=24h
```

### 4. Iniciar el servidor
```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## Endpoints de Autenticación

### 📝 Registro de Usuario

**Endpoint:** `POST /api/auth/register`

**Descripción:** Crea una nueva cuenta de usuario en el sistema.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "nombreCompleto": "Juan Pérez",
  "correoElectronico": "juan@example.com",
  "rol": "cajero",
  "contrasena": "password123"
}
```

**Campos:**
- `nombreCompleto` (string, requerido): Nombre completo del usuario (3-100 caracteres)
- `correoElectronico` (string, requerido): Email válido y único
- `rol` (string, requerido): Rol del usuario (ver [Roles Disponibles](#roles-disponibles))
- `contrasena` (string, requerido): Contraseña (mínimo 6 caracteres)

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Usuario registrado exitosamente",
  "datos": {
    "uid": "abc123xyz",
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "rol": "cajero",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes o inválidos
- `409`: El correo electrónico ya está registrado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "rol": "cajero",
    "contrasena": "password123"
  }'
```

---

### 🔐 Inicio de Sesión

**Endpoint:** `POST /api/auth/login`

**Descripción:** Autentica un usuario y devuelve un token JWT.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "correoElectronico": "juan@example.com",
  "contrasena": "password123"
}
```

**Campos:**
- `correoElectronico` (string, requerido): Email de la cuenta
- `contrasena` (string, requerido): Contraseña de la cuenta

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Inicio de sesión exitoso",
  "datos": {
    "uid": "abc123xyz",
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "rol": "cajero",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes
- `401`: Credenciales inválidas
- `403`: Usuario inactivo
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correoElectronico": "juan@example.com",
    "contrasena": "password123"
  }'
```

---

### 👤 Obtener Perfil del Usuario

**Endpoint:** `GET /api/auth/perfil`

**Descripción:** Obtiene la información del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "uid": "abc123xyz",
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "rol": "cajero",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `401`: Token no proporcionado, inválido o expirado
- `404`: Usuario no encontrado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/auth/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Roles Disponibles

| Rol | Descripción |
|-----|-------------|
| `admin` | Administrador del sistema con acceso completo |
| `gerente` | Gerente del restaurante |
| `cajero` | Cajero/Punto de venta |
| `mesero` | Mesero/Atención al cliente |
| `cocinero` | Cocinero/Personal de cocina |

---

## Estructura del Proyecto

```
POS-Restaurant/
├── src/
│   ├── config/
│   │   └── firebase.js          # Configuración de Firebase
│   ├── controllers/
│   │   └── authController.js    # Lógica de autenticación
│   ├── middleware/
│   │   └── auth.js              # Middleware JWT y roles
│   ├── models/
│   │   └── Usuario.js           # Modelo de Usuario
│   ├── routes/
│   │   ├── authRoutes.js        # Rutas de autenticación
│   │   └── index.js             # Enrutador principal
│   └── index.js                 # Servidor Express
├── .env                         # Variables de entorno
├── .gitignore
├── package.json
├── serviceAccountKey.json       # Credenciales de Firebase (no incluir en git)
└── README.md
```

---

## 🔒 Notas de Seguridad

- Los tokens JWT expiran en 24 horas por defecto (configurable en `.env`)
- Las contraseñas se hashean con bcrypt antes de almacenarse
- El archivo `serviceAccountKey.json` NO debe incluirse en el control de versiones
- En producción, cambia `JWT_SECRET` por una clave segura y aleatoria
- Las contraseñas deben tener mínimo 6 caracteres
