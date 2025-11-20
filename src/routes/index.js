const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const itemMenuRoutes = require('./itemMenuRoutes');

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de categorías
router.use('/categorias', categoriaRoutes);

// Rutas de ítems del menú
router.use('/items', itemMenuRoutes);

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
    },
  });
});

module.exports = router;
