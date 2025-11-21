const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/firebase'); // Inicializar Firebase automáticamente
const routes = require('./routes');

// Crear aplicación Express
const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger simple para desarrollo
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api', routes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada',
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    exito: false,
    mensaje: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   🚀 Servidor iniciado correctamente           ║
║                                                ║
║   📍 Puerto: ${PORT}                              ║
║   🌍 Entorno: ${process.env.NODE_ENV || 'development'}                   ║
║   📡 URL: http://localhost:${PORT}               ║
║                                                ║
║   Endpoints disponibles:                       ║
║   • POST /api/auth/register                    ║
║   • POST /api/auth/login                       ║
║   • GET  /api/auth/perfil                      ║
║   • POST /api/categorias                       ║
║   • GET  /api/categorias                       ║
║   • POST /api/items                            ║
║   • GET  /api/items                            ║
║   • POST /api/reservaciones                    ║
║   • GET  /api/reservaciones                    ║
║   • GET  /api/configuracion                    ║
║   • POST /api/mesas                            ║
║   • GET  /api/mesas                            ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
