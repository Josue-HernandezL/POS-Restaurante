const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const itemMenuRoutes = require('./itemMenuRoutes');
const reservacionRoutes = require('./reservacionRoutes');
const configuracionRoutes = require('./configuracionRoutes');

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de categorías
router.use('/categorias', categoriaRoutes);

// Rutas de ítems del menú
router.use('/items', itemMenuRoutes);

// Rutas de reservaciones
router.use('/reservaciones', reservacionRoutes);

// Rutas de configuración
router.use('/configuracion', configuracionRoutes);

// Ruta de bienvenida
router.get('/', (req, res) => {
  res.json({
    mensaje: 'Bienvenido a la API de POS Restaurant',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        perfil: 'GET /api/auth/perfil (requiere token)',
      },
      categorias: {
        crear: 'POST /api/categorias (requiere token - admin/gerente)',
        listar: 'GET /api/categorias (requiere token)',
        obtener: 'GET /api/categorias/:id (requiere token)',
        actualizar: 'PUT /api/categorias/:id (requiere token - admin/gerente)',
        eliminar: 'DELETE /api/categorias/:id (requiere token - admin/gerente)',
      },
      items: {
        crear: 'POST /api/items (requiere token - admin/gerente)',
        listar: 'GET /api/items (requiere token)',
        obtener: 'GET /api/items/:id (requiere token)',
        actualizar: 'PUT /api/items/:id (requiere token - admin/gerente)',
        eliminar: 'DELETE /api/items/:id (requiere token - admin/gerente)',
      },
      reservaciones: {
        crear: 'POST /api/reservaciones (requiere token)',
        listar: 'GET /api/reservaciones (requiere token)',
        obtener: 'GET /api/reservaciones/:id (requiere token)',
        actualizar: 'PUT /api/reservaciones/:id (requiere token)',
        sentar: 'PATCH /api/reservaciones/:id/sentar (requiere token)',
        terminar: 'PATCH /api/reservaciones/:id/terminar (requiere token)',
        cancelar: 'PATCH /api/reservaciones/:id/cancelar (requiere token)',
      },
      configuracion: {
        obtener: 'GET /api/configuracion (requiere token)',
        actualizarRestaurante: 'PUT /api/configuracion/restaurante (requiere token - admin/gerente)',
        actualizarNotificaciones: 'PUT /api/configuracion/notificaciones (requiere token - admin/gerente)',
        actualizarImpuestos: 'PUT /api/configuracion/impuestos (requiere token - admin/gerente)',
        actualizarPropinas: 'PUT /api/configuracion/propinas (requiere token - admin/gerente)',
      },
    },
  });
});

module.exports = router;
