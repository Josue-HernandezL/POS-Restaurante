const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');

// Rutas de autenticación
router.use('/auth', authRoutes);

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
    },
  });
});

module.exports = router;
