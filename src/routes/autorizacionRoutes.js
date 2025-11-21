const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const autorizacionController = require('../controllers/autorizacionController');
const { verificarToken } = require('../middleware/auth');
const { requierePermiso } = require('../middleware/permisos');
const Rol = require('../models/Rol');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/autorizaciones/estadisticas
 * @desc    Obtiene estadísticas de autorizaciones
 * @access  Privado - Requiere permiso VIEW_REPORTS o VIEW_ALL
 */
router.get(
  '/estadisticas',
  requierePermiso([Rol.PERMISOS.VER_REPORTES, Rol.PERMISOS.VER_TODO]),
  autorizacionController.obtenerEstadisticas
);

/**
 * @route   GET /api/autorizaciones/usuario/:usuarioId
 * @desc    Obtiene autorizaciones de un usuario específico
 * @access  Privado - Requiere permiso VIEW_ALL o MANAGE_USERS
 */
router.get(
  '/usuario/:usuarioId',
  requierePermiso([Rol.PERMISOS.VER_TODO, Rol.PERMISOS.GESTIONAR_USUARIOS]),
  [
    param('usuarioId').notEmpty().withMessage('El ID del usuario es requerido')
  ],
  autorizacionController.obtenerAutorizacionesPorUsuario
);

/**
 * @route   POST /api/autorizaciones
 * @desc    Registra una nueva autorización
 * @access  Privado - Cualquier usuario autenticado
 */
router.post(
  '/',
  [
    body('accion')
      .notEmpty().withMessage('La acción es requerida'),
    body('modulo')
      .notEmpty().withMessage('El módulo es requerido')
      .isIn(['usuarios', 'pedidos', 'pagos', 'menu', 'mesas', 'reservaciones', 'configuracion', 'reportes', 'cocina', 'autenticacion'])
      .withMessage('Módulo inválido'),
    body('detalles')
      .optional()
      .isObject().withMessage('Los detalles deben ser un objeto'),
    body('autorizadoPorId')
      .optional(),
    body('autorizadoPorNombre')
      .optional(),
    body('autorizadoPorRol')
      .optional(),
    body('resultado')
      .optional()
      .isIn(['exitoso', 'fallido', 'pendiente']).withMessage('Resultado inválido'),
    body('requiereAutorizacion')
      .optional()
      .isBoolean().withMessage('requiereAutorizacion debe ser booleano')
  ],
  autorizacionController.registrarAutorizacion
);

/**
 * @route   GET /api/autorizaciones
 * @desc    Obtiene el historial de autorizaciones con filtros
 * @access  Privado - Requiere permiso VIEW_REPORTS o VIEW_ALL
 */
router.get(
  '/',
  requierePermiso([Rol.PERMISOS.VER_REPORTES, Rol.PERMISOS.VER_TODO]),
  [
    query('fechaInicio')
      .optional()
      .isISO8601().withMessage('Fecha de inicio debe estar en formato ISO 8601'),
    query('fechaFin')
      .optional()
      .isISO8601().withMessage('Fecha de fin debe estar en formato ISO 8601'),
    query('accion')
      .optional(),
    query('modulo')
      .optional()
      .isIn(['usuarios', 'pedidos', 'pagos', 'menu', 'mesas', 'reservaciones', 'configuracion', 'reportes', 'cocina', 'autenticacion'])
      .withMessage('Módulo inválido'),
    query('usuarioId')
      .optional(),
    query('autorizadoPorId')
      .optional(),
    query('resultado')
      .optional()
      .isIn(['exitoso', 'fallido', 'pendiente']).withMessage('Resultado inválido'),
    query('limite')
      .optional()
      .isInt({ min: 1, max: 500 }).withMessage('El límite debe estar entre 1 y 500')
  ],
  autorizacionController.obtenerAutorizaciones
);

/**
 * @route   GET /api/autorizaciones/:id
 * @desc    Obtiene una autorización específica por ID
 * @access  Privado - Requiere permiso VIEW_REPORTS o VIEW_ALL
 */
router.get(
  '/:id',
  requierePermiso([Rol.PERMISOS.VER_REPORTES, Rol.PERMISOS.VER_TODO]),
  [
    param('id').notEmpty().withMessage('El ID de la autorización es requerido')
  ],
  autorizacionController.obtenerAutorizacionPorId
);

module.exports = router;
