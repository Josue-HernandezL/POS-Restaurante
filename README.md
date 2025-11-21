# POS Restaurant API

API REST para sistema de punto de venta de restaurante usando Express y Firebase.

## 📋 Tabla de Contenidos

- [Configuración Inicial](#configuración-inicial)
- [Endpoints de Autenticación](#endpoints-de-autenticación)
- [Endpoints de Gestión de Menú](#endpoints-de-gestión-de-menú)
  - [Categorías](#categorías)
  - [Ítems del Menú](#ítems-del-menú)
- [Endpoints de Reservaciones](#endpoints-de-reservaciones)
- [Endpoints de Configuración](#endpoints-de-configuración)
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

## Endpoints de Gestión de Menú

### Categorías

#### 📁 Crear Categoría

**Endpoint:** `POST /api/categorias`

**Descripción:** Crea una nueva categoría para el menú.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "nombre": "Bebidas",
  "descripcion": "Bebidas frías y calientes"
}
```

**Campos:**
- `nombre` (string, requerido): Nombre de la categoría (3-50 caracteres, único)
- `descripcion` (string, requerido): Descripción de la categoría (máx. 200 caracteres)

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Categoría creada exitosamente",
  "datos": {
    "id": "cat123abc",
    "nombre": "Bebidas",
    "descripcion": "Bebidas frías y calientes",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes o inválidos
- `401`: Token no proporcionado o inválido
- `403`: Sin permisos (no es admin ni gerente)
- `409`: Ya existe una categoría con ese nombre
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/categorias \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Bebidas",
    "descripcion": "Bebidas frías y calientes"
  }'
```

---

#### 📋 Listar Categorías

**Endpoint:** `GET /api/categorias`

**Descripción:** Obtiene todas las categorías.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `activo` (boolean): Filtrar por estado activo (`true` o `false`)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "id": "cat123abc",
      "nombre": "Bebidas",
      "descripcion": "Bebidas frías y calientes",
      "creadoEn": "2025-11-20T10:30:00.000Z",
      "actualizadoEn": "2025-11-20T10:30:00.000Z",
      "activo": true
    },
    {
      "id": "cat456def",
      "nombre": "Entradas",
      "descripcion": "Aperitivos y entradas",
      "creadoEn": "2025-11-20T11:00:00.000Z",
      "actualizadoEn": "2025-11-20T11:00:00.000Z",
      "activo": true
    }
  ],
  "total": 2
}
```

**Ejemplo con cURL:**
```bash
# Todas las categorías
curl -X GET http://localhost:3000/api/categorias \
  -H "Authorization: Bearer {token}"

# Solo categorías activas
curl -X GET "http://localhost:3000/api/categorias?activo=true" \
  -H "Authorization: Bearer {token}"
```

---

#### 🔍 Obtener Categoría por ID

**Endpoint:** `GET /api/categorias/:id`

**Descripción:** Obtiene los detalles de una categoría específica.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "cat123abc",
    "nombre": "Bebidas",
    "descripcion": "Bebidas frías y calientes",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `404`: Categoría no encontrada

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/categorias/cat123abc \
  -H "Authorization: Bearer {token}"
```

---

#### ✏️ Actualizar Categoría

**Endpoint:** `PUT /api/categorias/:id`

**Descripción:** Actualiza una categoría existente.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nombre": "Bebidas Premium",
  "descripcion": "Bebidas premium y especiales",
  "activo": true
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Categoría actualizada exitosamente",
  "datos": {
    "id": "cat123abc",
    "nombre": "Bebidas Premium",
    "descripcion": "Bebidas premium y especiales",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T15:45:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos
- `403`: Sin permisos
- `404`: Categoría no encontrada
- `409`: El nuevo nombre ya existe

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/categorias/cat123abc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Bebidas Premium"
  }'
```

---

#### 🗑️ Eliminar Categoría

**Endpoint:** `DELETE /api/categorias/:id`

**Descripción:** Elimina una categoría (soft delete - marca como inactiva).

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Categoría eliminada exitosamente"
}
```

**Errores posibles:**
- `400`: La categoría tiene ítems asociados activos
- `403`: Sin permisos
- `404`: Categoría no encontrada

**Ejemplo con cURL:**
```bash
curl -X DELETE http://localhost:3000/api/categorias/cat123abc \
  -H "Authorization: Bearer {token}"
```

---

### Ítems del Menú

#### 🍽️ Crear Ítem del Menú

**Endpoint:** `POST /api/items`

**Descripción:** Crea un nuevo ítem en el menú.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "nombre": "Café Americano",
  "categoriaId": "cat123abc",
  "precio": 35.00,
  "disponibilidad": true,
  "descripcion": "Café americano preparado con granos seleccionados"
}
```

**Campos:**
- `nombre` (string, requerido): Nombre del ítem (3-100 caracteres)
- `categoriaId` (string, requerido): ID de la categoría (debe existir y estar activa)
- `precio` (number, requerido): Precio del ítem (≥ 0)
- `disponibilidad` (boolean, opcional): Si el ítem está disponible (default: true)
- `descripcion` (string, requerido): Descripción del ítem (máx. 300 caracteres)

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Ítem creado exitosamente",
  "datos": {
    "id": "item789xyz",
    "nombre": "Café Americano",
    "categoriaId": "cat123abc",
    "precio": 35,
    "disponibilidad": true,
    "descripcion": "Café americano preparado con granos seleccionados",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true,
    "categoria": {
      "id": "cat123abc",
      "nombre": "Bebidas"
    }
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes, inválidos, o categoría inactiva
- `403`: Sin permisos
- `404`: Categoría no existe
- `409`: Ya existe un ítem con ese nombre en la categoría
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Café Americano",
    "categoriaId": "cat123abc",
    "precio": 35.00,
    "disponibilidad": true,
    "descripcion": "Café americano preparado con granos seleccionados"
  }'
```

---

#### 📋 Listar Ítems del Menú

**Endpoint:** `GET /api/items`

**Descripción:** Obtiene todos los ítems del menú.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `categoriaId` (string): Filtrar por categoría específica
- `disponibilidad` (boolean): Filtrar por disponibilidad (`true` o `false`)
- `activo` (boolean): Filtrar por estado activo (`true` o `false`)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "id": "item789xyz",
      "nombre": "Café Americano",
      "categoriaId": "cat123abc",
      "precio": 35,
      "disponibilidad": true,
      "descripcion": "Café americano preparado con granos seleccionados",
      "creadoEn": "2025-11-20T10:30:00.000Z",
      "actualizadoEn": "2025-11-20T10:30:00.000Z",
      "activo": true,
      "categoria": {
        "id": "cat123abc",
        "nombre": "Bebidas"
      }
    }
  ],
  "total": 1
}
```

**Ejemplo con cURL:**
```bash
# Todos los ítems
curl -X GET http://localhost:3000/api/items \
  -H "Authorization: Bearer {token}"

# Solo ítems disponibles de una categoría
curl -X GET "http://localhost:3000/api/items?categoriaId=cat123abc&disponibilidad=true" \
  -H "Authorization: Bearer {token}"
```

---

#### 🔍 Obtener Ítem por ID

**Endpoint:** `GET /api/items/:id`

**Descripción:** Obtiene los detalles de un ítem específico.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "item789xyz",
    "nombre": "Café Americano",
    "categoriaId": "cat123abc",
    "precio": 35,
    "disponibilidad": true,
    "descripcion": "Café americano preparado con granos seleccionados",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true,
    "categoria": {
      "id": "cat123abc",
      "nombre": "Bebidas",
      "descripcion": "Bebidas frías y calientes"
    }
  }
}
```

**Errores posibles:**
- `404`: Ítem no encontrado

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/items/item789xyz \
  -H "Authorization: Bearer {token}"
```

---

#### ✏️ Actualizar Ítem

**Endpoint:** `PUT /api/items/:id`

**Descripción:** Actualiza un ítem existente del menú.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nombre": "Café Americano Grande",
  "precio": 45.00,
  "disponibilidad": false,
  "descripcion": "Café americano grande preparado con granos premium"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Ítem actualizado exitosamente",
  "datos": {
    "id": "item789xyz",
    "nombre": "Café Americano Grande",
    "categoriaId": "cat123abc",
    "precio": 45,
    "disponibilidad": false,
    "descripcion": "Café americano grande preparado con granos premium",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:20:00.000Z",
    "activo": true,
    "categoria": {
      "id": "cat123abc",
      "nombre": "Bebidas"
    }
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos o categoría inactiva
- `403`: Sin permisos
- `404`: Ítem o categoría no encontrada

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/items/item789xyz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "precio": 45.00,
    "disponibilidad": false
  }'
```

---

#### 🗑️ Eliminar Ítem

**Endpoint:** `DELETE /api/items/:id`

**Descripción:** Elimina un ítem del menú (soft delete - marca como inactivo).

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Ítem eliminado exitosamente"
}
```

**Errores posibles:**
- `403`: Sin permisos
- `404`: Ítem no encontrado

**Ejemplo con cURL:**
```bash
curl -X DELETE http://localhost:3000/api/items/item789xyz \
  -H "Authorization: Bearer {token}"
```

---

## Endpoints de Reservaciones

### 📅 Crear Reservación

**Endpoint:** `POST /api/reservaciones`

**Descripción:** Crea una nueva reservación en el sistema. Valida automáticamente conflictos de mesa en una ventana de 2 horas.

**Autenticación:** Requerida

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "nombreCliente": "María García",
  "telefono": "5551234567",
  "fecha": "2025-11-25",
  "hora": "19:30",
  "numeroPersonas": 4,
  "mesaAsignada": "Mesa 5",
  "notas": "Cliente prefiere área tranquila"
}
```

**Campos:**
- `nombreCliente` (string, requerido): Nombre del cliente (3-100 caracteres)
- `telefono` (string, requerido): Teléfono de contacto (mínimo 10 dígitos)
- `fecha` (string, requerido): Fecha de la reservación en formato YYYY-MM-DD
- `hora` (string, requerido): Hora de la reservación en formato HH:MM (24 horas)
- `numeroPersonas` (number, requerido): Cantidad de personas (1-20)
- `mesaAsignada` (string, requerido): Identificador de la mesa (3-50 caracteres)
- `notas` (string, opcional): Notas o comentarios adicionales (máx. 500 caracteres)

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Reservación creada exitosamente",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "pendiente",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes, inválidos, o conflicto de mesa
- `401`: Token no proporcionado o inválido
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/reservaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila"
  }'
```

---

### 📋 Listar Reservaciones

**Endpoint:** `GET /api/reservaciones`

**Descripción:** Obtiene todas las reservaciones con opciones de filtrado.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `fecha` (string): Filtrar por fecha específica (formato YYYY-MM-DD)
- `estado` (string): Filtrar por estado (`pendiente`, `confirmada`, `sentada`, `terminada`, `cancelada`)
- `mesaAsignada` (string): Filtrar por mesa asignada

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "id": "res123abc",
      "nombreCliente": "María García",
      "telefono": "5551234567",
      "fecha": "2025-11-25",
      "hora": "19:30",
      "numeroPersonas": 4,
      "mesaAsignada": "Mesa 5",
      "notas": "Cliente prefiere área tranquila",
      "estado": "pendiente",
      "creadoEn": "2025-11-20T10:30:00.000Z",
      "actualizadoEn": "2025-11-20T10:30:00.000Z",
      "creadoPor": "abc123xyz"
    },
    {
      "id": "res456def",
      "nombreCliente": "Carlos López",
      "telefono": "5559876543",
      "fecha": "2025-11-25",
      "hora": "20:00",
      "numeroPersonas": 2,
      "mesaAsignada": "Mesa 3",
      "notas": "",
      "estado": "confirmada",
      "creadoEn": "2025-11-20T11:00:00.000Z",
      "actualizadoEn": "2025-11-20T14:30:00.000Z",
      "creadoPor": "abc123xyz"
    }
  ],
  "total": 2
}
```

**Ejemplo con cURL:**
```bash
# Todas las reservaciones
curl -X GET http://localhost:3000/api/reservaciones \
  -H "Authorization: Bearer {token}"

# Reservaciones de una fecha específica
curl -X GET "http://localhost:3000/api/reservaciones?fecha=2025-11-25" \
  -H "Authorization: Bearer {token}"

# Reservaciones pendientes de una mesa
curl -X GET "http://localhost:3000/api/reservaciones?estado=pendiente&mesaAsignada=Mesa%205" \
  -H "Authorization: Bearer {token}"
```

---

### 🔍 Obtener Reservación por ID

**Endpoint:** `GET /api/reservaciones/:id`

**Descripción:** Obtiene los detalles de una reservación específica.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "pendiente",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/reservaciones/res123abc \
  -H "Authorization: Bearer {token}"
```

---

### ✏️ Actualizar Reservación

**Endpoint:** `PUT /api/reservaciones/:id`

**Descripción:** Actualiza una reservación existente. No se pueden editar reservaciones terminadas o canceladas.

**Autenticación:** Requerida

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nombreCliente": "María García Pérez",
  "telefono": "5551234568",
  "fecha": "2025-11-26",
  "hora": "20:00",
  "numeroPersonas": 5,
  "mesaAsignada": "Mesa 8",
  "notas": "Cliente prefiere área tranquila, celebración de cumpleaños",
  "estado": "confirmada"
}
```

**Campos actualizables:**
- `nombreCliente` (string): Nombre del cliente
- `telefono` (string): Teléfono (mínimo 10 dígitos)
- `fecha` (string): Fecha (YYYY-MM-DD)
- `hora` (string): Hora (HH:MM)
- `numeroPersonas` (number): Cantidad de personas (1-20)
- `mesaAsignada` (string): Mesa asignada
- `notas` (string): Notas adicionales
- `estado` (string): Estado de la reservación

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Reservación actualizada exitosamente",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García Pérez",
    "telefono": "5551234568",
    "fecha": "2025-11-26",
    "hora": "20:00",
    "numeroPersonas": 5,
    "mesaAsignada": "Mesa 8",
    "notas": "Cliente prefiere área tranquila, celebración de cumpleaños",
    "estado": "confirmada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:45:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos, conflicto de mesa, o reservación terminada/cancelada
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/reservaciones/res123abc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "numeroPersonas": 5,
    "estado": "confirmada"
  }'
```

---

### 🪑 Marcar Reservación como Sentada

**Endpoint:** `PATCH /api/reservaciones/:id/sentar`

**Descripción:** Marca una reservación como sentada cuando el cliente llega al restaurante. Solo permite cambiar de estado `pendiente` o `confirmada` a `sentada`.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Reservación marcada como sentada",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "sentada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-25T19:32:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: La reservación no está en estado pendiente o confirmada
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/reservaciones/res123abc/sentar \
  -H "Authorization: Bearer {token}"
```

---

### ✅ Marcar Reservación como Terminada

**Endpoint:** `PATCH /api/reservaciones/:id/terminar`

**Descripción:** Marca una reservación como terminada cuando el cliente finaliza su visita. Solo permite cambiar de estado `sentada` a `terminada`.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Reservación marcada como terminada",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "terminada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-25T21:15:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: La reservación no está en estado sentada
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/reservaciones/res123abc/terminar \
  -H "Authorization: Bearer {token}"
```

---

### ❌ Cancelar Reservación

**Endpoint:** `PATCH /api/reservaciones/:id/cancelar`

**Descripción:** Cancela una reservación. No se pueden cancelar reservaciones que ya están terminadas o canceladas.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Reservación cancelada exitosamente",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "cancelada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-25T18:00:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: La reservación ya está terminada o cancelada
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/reservaciones/res123abc/cancelar \
  -H "Authorization: Bearer {token}"
```

---

### 📊 Estados de Reservación

Las reservaciones siguen un flujo de estados específico:

```
pendiente → confirmada → sentada → terminada
    ↓           ↓           ↓
         cancelada    cancelada
```

| Estado | Descripción | Transiciones Permitidas |
|--------|-------------|------------------------|
| `pendiente` | Reservación creada, esperando confirmación | → confirmada, sentada, cancelada |
| `confirmada` | Reservación confirmada por el cliente | → sentada, cancelada |
| `sentada` | Cliente ha llegado y está en la mesa | → terminada, cancelada |
| `terminada` | Cliente ha finalizado su visita | (estado final) |
| `cancelada` | Reservación cancelada | (estado final) |

**Reglas importantes:**
- Una reservación en estado `terminada` o `cancelada` no puede ser editada
- Solo las reservaciones en estado `sentada` pueden marcarse como terminadas
- Solo las reservaciones en estado `pendiente` o `confirmada` pueden marcarse como sentadas
- El sistema valida automáticamente conflictos de mesa (ventana de 2 horas)
- Los números de teléfono deben tener mínimo 10 dígitos
- El número de personas permitido es de 1 a 20

---

## Endpoints de Configuración

### ⚙️ Obtener Configuración

**Endpoint:** `GET /api/configuracion`

**Descripción:** Obtiene la configuración actual del restaurante. Si no existe, se crea automáticamente con valores por defecto.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": true
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z"
  }
}
```

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/configuracion \
  -H "Authorization: Bearer {token}"
```

---

### 🏪 Actualizar Información del Restaurante

**Endpoint:** `PUT /api/configuracion/restaurante`

**Descripción:** Actualiza la información básica del restaurante.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nombre": "Mi Restaurante",
  "direccion": "Calle Principal 123",
  "telefono": "5551234567",
  "numeroMesas": 20
}
```

**Campos:**
- `nombre` (string, opcional): Nombre del restaurante (3-100 caracteres)
- `direccion` (string, opcional): Dirección del restaurante (10-200 caracteres)
- `telefono` (string, opcional): Teléfono de contacto (mínimo 10 dígitos)
- `numeroMesas` (number, opcional): Número total de mesas (0-500)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Información del restaurante actualizada exitosamente",
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": true
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T15:45:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Campos inválidos o fuera de rango
- `403`: Sin permisos (no es admin ni gerente)
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/configuracion/restaurante \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Mi Restaurante",
    "direccion": "Calle Principal 123",
    "telefono": "5551234567",
    "numeroMesas": 20
  }'
```

---

### 🔔 Actualizar Configuración de Notificaciones

**Endpoint:** `PUT /api/configuracion/notificaciones`

**Descripción:** Activa o desactiva las notificaciones del sistema.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nuevasOrdenes": true,
  "nuevasReservaciones": false
}
```

**Campos:**
- `nuevasOrdenes` (boolean, opcional): Recibir notificaciones de nuevas órdenes
- `nuevasReservaciones` (boolean, opcional): Recibir notificaciones de nuevas reservaciones

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Configuración de notificaciones actualizada exitosamente",
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": false
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:00:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Valores inválidos (deben ser booleanos)
- `403`: Sin permisos
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/configuracion/notificaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nuevasOrdenes": true,
    "nuevasReservaciones": false
  }'
```

---

### 💰 Actualizar Configuración de Impuestos

**Endpoint:** `PUT /api/configuracion/impuestos`

**Descripción:** Configura el porcentaje de IVA que se aplicará a las órdenes.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "porcentajeIVA": 16,
  "aplicarATodos": true
}
```

**Campos:**
- `porcentajeIVA` (number, opcional): Porcentaje de IVA (0-100)
- `aplicarATodos` (boolean, opcional): Si se aplica el IVA a todas las órdenes

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Configuración de impuestos actualizada exitosamente",
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": true
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:15:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Porcentaje fuera de rango (0-100) o valores inválidos
- `403`: Sin permisos
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/configuracion/impuestos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "porcentajeIVA": 16,
    "aplicarATodos": true
  }'
```

---

### 💵 Actualizar Opciones de Propina

**Endpoint:** `PUT /api/configuracion/propinas`

**Descripción:** Configura las opciones de propina sugeridas que se mostrarán al cliente.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "opcion1": 10,
  "opcion2": 15,
  "opcion3": 20,
  "permitirPersonalizada": true
}
```

**Campos:**
- `opcion1` (number, opcional): Primera opción de propina en porcentaje (0-100)
- `opcion2` (number, opcional): Segunda opción de propina en porcentaje (0-100)
- `opcion3` (number, opcional): Tercera opción de propina en porcentaje (0-100)
- `permitirPersonalizada` (boolean, opcional): Permitir que el cliente ingrese una propina personalizada

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Opciones de propina actualizadas exitosamente",
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": true
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Porcentajes fuera de rango (0-100) o valores inválidos
- `403`: Sin permisos
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/configuracion/propinas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "opcion1": 10,
    "opcion2": 15,
    "opcion3": 20,
    "permitirPersonalizada": true
  }'
```

---

### 📊 Estructura de Configuración

La configuración del sistema se organiza en cuatro secciones principales:

**1. Información del Restaurante:**
- Datos básicos del establecimiento
- Nombre, dirección, teléfono y número de mesas

**2. Notificaciones:**
- Control de alertas del sistema
- Nuevas órdenes y nuevas reservaciones

**3. Impuestos:**
- Configuración de IVA
- Porcentaje aplicable y opciones de aplicación

**4. Propinas:**
- Opciones sugeridas para clientes
- Tres porcentajes predefinidos
- Opción para permitir propinas personalizadas

**Reglas importantes:**
- Solo usuarios con rol `admin` o `gerente` pueden modificar la configuración
- Todos los endpoints permiten actualizaciones parciales (solo enviar campos a modificar)
- Si no existe configuración al consultar, se crea automáticamente con valores por defecto
- Los cambios se reflejan inmediatamente en todo el sistema
- Solo existe un documento de configuración para todo el restaurante

---

## 🪑 Gestión de Mesas

### Inicialización de Mesas

Las mesas se crean automáticamente basándose en el número configurado en la configuración del restaurante. **No es necesario crear mesas individualmente**, el sistema las genera todas en un solo paso.

### 🔧 Inicializar Mesas

**Endpoint:** `POST /api/mesas/inicializar`

**Descripción:** Crea automáticamente todas las mesas según el `numeroMesas` configurado en `/api/configuracion/restaurante`. Las mesas se crean con valores predeterminados que luego pueden editarse individualmente.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Proceso de inicialización:**
1. Lee el `numeroMesas` de la configuración del restaurante
2. Verifica cuántas mesas activas ya existen
3. Crea las mesas faltantes con estos valores por defecto:
   - **Número:** "Mesa 1", "Mesa 2", "Mesa 3", etc.
   - **Capacidad:** 4 personas
   - **Sección:** "Sin asignar"
   - **Estado:** "libre"

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Se crearon 20 mesas exitosamente",
  "datos": {
    "mesasCreadas": 20,
    "totalMesas": 20,
    "mesas": [
      {
        "id": "uueVavsgIK79DybMLdW4",
        "numeroMesa": "Mesa 1",
        "capacidad": 4,
        "seccion": "Sin asignar",
        "estado": "libre",
        "creadoEn": "2025-11-20T10:30:00.000Z",
        "actualizadoEn": "2025-11-20T10:30:00.000Z",
        "activo": true
      },
      {
        "id": "xyz789abc123def456",
        "numeroMesa": "Mesa 2",
        "capacidad": 4,
        "seccion": "Sin asignar",
        "estado": "libre",
        "creadoEn": "2025-11-20T10:30:01.000Z",
        "actualizadoEn": "2025-11-20T10:30:01.000Z",
        "activo": true
      }
      // ... resto de las mesas
    ]
  }
}
```

**Si ya existen todas las mesas (400):**
```json
{
  "exito": false,
  "error": "Ya existen todas las mesas configuradas (20)"
}
```

**Errores posibles:**
- `400`: Ya existen todas las mesas o número de mesas es 0
- `403`: Sin permisos (no es admin ni gerente)
- `404`: No existe configuración del restaurante
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/mesas/inicializar \
  -H "Authorization: Bearer {token}"
```

**Notas importantes:** 
- ⚠️ **Primero debes configurar** el `numeroMesas` en `/api/configuracion/restaurante`
- Este endpoint solo crea mesas nuevas, **no elimina las existentes**
- Si ya tienes 10 mesas y configuras 20, solo creará las 10 faltantes
- Después de inicializar, edita cada mesa para asignar capacidad y sección específicas

---

### 📋 Listar Mesas

**Endpoint:** `GET /api/mesas`

**Descripción:** Obtiene la lista de todas las mesas activas del restaurante, con opción de filtrar por estado.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `estado`: Filtrar por estado de la mesa
  - Valores: `libre`, `ocupada`, `reservada`, `en_limpieza`
  - Si no se especifica, devuelve todas las mesas

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "mesas": [
      {
        "id": "uueVavsgIK79DybMLdW4",
        "numeroMesa": "Mesa 1",
        "capacidad": 4,
        "seccion": "Salon Principal",
        "estado": "libre",
        "creadoEn": "2025-11-20T10:30:00.000Z",
        "actualizadoEn": "2025-11-20T10:30:00.000Z",
        "activo": true
      },
      {
        "id": "xyz789abc123def456",
        "numeroMesa": "Mesa 2",
        "capacidad": 6,
        "seccion": "Terraza",
        "estado": "ocupada",
        "creadoEn": "2025-11-20T10:35:00.000Z",
        "actualizadoEn": "2025-11-20T14:20:00.000Z",
        "activo": true
      }
    ],
    "total": 2
  }
}
```

**Ejemplos de filtrado:**

**Todas las mesas:**
```bash
curl -X GET http://localhost:3000/api/mesas \
  -H "Authorization: Bearer {token}"
```

**Solo mesas libres:**
```bash
curl -X GET "http://localhost:3000/api/mesas?estado=libre" \
  -H "Authorization: Bearer {token}"
```

**Solo mesas ocupadas:**
```bash
curl -X GET "http://localhost:3000/api/mesas?estado=ocupada" \
  -H "Authorization: Bearer {token}"
```

**Solo mesas reservadas:**
```bash
curl -X GET "http://localhost:3000/api/mesas?estado=reservada" \
  -H "Authorization: Bearer {token}"
```

**Solo mesas en limpieza:**
```bash
curl -X GET "http://localhost:3000/api/mesas?estado=en_limpieza" \
  -H "Authorization: Bearer {token}"
```

**Errores posibles:**
- `400`: Estado inválido
- `401`: No autenticado
- `500`: Error del servidor

---

### 🔍 Obtener Mesa por ID

**Endpoint:** `GET /api/mesas/:id`

**Descripción:** Obtiene los detalles de una mesa específica.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID de la mesa

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "uueVavsgIK79DybMLdW4",
    "numeroMesa": "Mesa 1",
    "capacidad": 4,
    "seccion": "Salon Principal",
    "estado": "libre",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `404`: Mesa no encontrada
- `401`: No autenticado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4 \
  -H "Authorization: Bearer {token}"
```

---

### ✏️ Actualizar Mesa

**Endpoint:** `PUT /api/mesas/:id`

**Descripción:** Actualiza los datos de una mesa existente. Permite modificar capacidad, sección y estado.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID de la mesa

**Body (todos los campos son opcionales):**
```json
{
  "capacidad": 6,
  "seccion": "Terraza",
  "estado": "ocupada"
}
```

**Campos:**
- `capacidad` (number, opcional): Número de personas que puede acomodar (1-20)
- `seccion` (string, opcional): Sección donde se encuentra la mesa (3-100 caracteres)
- `estado` (string, opcional): Estado de la mesa
  - Valores: `libre`, `ocupada`, `reservada`, `en_limpieza`

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Mesa actualizada exitosamente",
  "datos": {
    "id": "uueVavsgIK79DybMLdW4",
    "numeroMesa": "Mesa 1",
    "capacidad": 6,
    "seccion": "Terraza",
    "estado": "ocupada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T14:20:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos
- `403`: Sin permisos (no es admin ni gerente)
- `404`: Mesa no encontrada
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "capacidad": 6,
    "seccion": "Terraza",
    "estado": "ocupada"
  }'
```

---

### 🔄 Cambiar Estado de Mesa

**Endpoint:** `PATCH /api/mesas/:id/estado`

**Descripción:** Endpoint específico para cambiar solo el estado de una mesa de forma rápida. Útil para actualizar el estado sin enviar otros datos.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID de la mesa

**Body:**
```json
{
  "estado": "ocupada"
}
```

**Campos:**
- `estado` (string, requerido): Nuevo estado de la mesa
  - Valores: `libre`, `ocupada`, `reservada`, `en_limpieza`

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Estado de la mesa actualizado exitosamente",
  "datos": {
    "id": "uueVavsgIK79DybMLdW4",
    "numeroMesa": "Mesa 1",
    "capacidad": 4,
    "seccion": "Salon Principal",
    "estado": "ocupada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T14:25:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Estado inválido
- `401`: No autenticado
- `404`: Mesa no encontrada
- `500`: Error del servidor

**Ejemplos con cURL:**

**Marcar mesa como ocupada:**
```bash
curl -X PATCH http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "ocupada"}'
```

**Marcar mesa como libre:**
```bash
curl -X PATCH http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "libre"}'
```

**Marcar mesa en limpieza:**
```bash
curl -X PATCH http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "en_limpieza"}'
```

---

### 🗑️ Eliminar Mesa

**Endpoint:** `DELETE /api/mesas/:id`

**Descripción:** Realiza una eliminación lógica de la mesa (marca como inactiva). La mesa no se elimina físicamente de la base de datos.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID de la mesa

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Mesa eliminada exitosamente"
}
```

**Errores posibles:**
- `403`: Sin permisos (no es admin ni gerente)
- `404`: Mesa no encontrada
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X DELETE http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4 \
  -H "Authorization: Bearer {token}"
```

---

### 📊 Estados de Mesa

Las mesas pueden tener los siguientes estados:

| Estado | Descripción | Color sugerido |
|--------|-------------|----------------|
| `libre` | Mesa disponible para asignar | 🟢 Verde |
| `ocupada` | Mesa con clientes actualmente | 🔴 Rojo |
| `reservada` | Mesa reservada para una hora específica | 🟡 Amarillo |
| `en_limpieza` | Mesa en proceso de limpieza | 🔵 Azul |

### 🔄 Flujo de Trabajo Recomendado

1. **Configuración inicial:**
   - Configura el `numeroMesas` en `/api/configuracion/restaurante`
   - Ejecuta `POST /api/mesas/inicializar` para crear todas las mesas

2. **Personalización:**
   - Edita cada mesa con `PUT /api/mesas/:id` para asignar:
     - Capacidad específica (2, 4, 6, 8 personas, etc.)
     - Sección ("Terraza", "Salon Principal", "VIP", etc.)

3. **Operación diaria:**
   - Los meseros consultan mesas libres: `GET /api/mesas?estado=libre`
   - Al asignar clientes: `PATCH /api/mesas/:id/estado` → `ocupada`
   - Al terminar: `PATCH /api/mesas/:id/estado` → `en_limpieza`
   - Después de limpiar: `PATCH /api/mesas/:id/estado` → `libre`

4. **Gestión de reservaciones:**
   - Al confirmar reserva: `PATCH /api/mesas/:id/estado` → `reservada`
   - Al llegar el cliente: `PATCH /api/mesas/:id/estado` → `ocupada`

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
