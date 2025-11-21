const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const { requierePermiso } = require('../middleware/permisos');
const { query } = require('express-validator');
const {
  obtenerMetricasPrincipales,
  obtenerVentasPorCategoria,
  obtenerProductosMasVendidos,
  obtenerOrdenesRecientes,
  obtenerResumenCompleto,
  obtenerTotalItemsMenu
} = require('../controllers/dashboardController');

/**
 * @route   GET /api/dashboard/resumen
 * @desc    Obtener resumen completo del dashboard con todas las métricas
 * @access  Privado (requiere permiso ver_reportes o ver_todo)
 */
router.get(
  '/resumen',
  verificarToken,
  requierePermiso('ver_reportes', 'ver_todo'),
  [
    query('fechaInicio').optional().isISO8601().withMessage('fechaInicio debe ser una fecha válida en formato ISO 8601'),
    query('fechaFin').optional().isISO8601().withMessage('fechaFin debe ser una fecha válida en formato ISO 8601')
  ],
  obtenerResumenCompleto
);

/**
 * @route   GET /api/dashboard/metricas
 * @desc    Obtener métricas principales del dashboard
 * @access  Privado (requiere permiso ver_reportes o ver_todo)
 */
router.get(
  '/metricas',
  verificarToken,
  requierePermiso('ver_reportes', 'ver_todo'),
  [
    query('fechaInicio').optional().isISO8601().withMessage('fechaInicio debe ser una fecha válida en formato ISO 8601'),
    query('fechaFin').optional().isISO8601().withMessage('fechaFin debe ser una fecha válida en formato ISO 8601')
  ],
  obtenerMetricasPrincipales
);

/**
 * @route   GET /api/dashboard/ventas-por-categoria
 * @desc    Obtener ventas agrupadas por categoría
 * @access  Privado (requiere permiso ver_reportes o ver_todo)
 */
router.get(
  '/ventas-por-categoria',
  verificarToken,
  requierePermiso('ver_reportes', 'ver_todo'),
  [
    query('fechaInicio').optional().isISO8601().withMessage('fechaInicio debe ser una fecha válida en formato ISO 8601'),
    query('fechaFin').optional().isISO8601().withMessage('fechaFin debe ser una fecha válida en formato ISO 8601')
  ],
  obtenerVentasPorCategoria
);

/**
 * @route   GET /api/dashboard/productos-mas-vendidos
 * @desc    Obtener los productos más vendidos
 * @access  Privado (requiere permiso ver_reportes o ver_todo)
 */
router.get(
  '/productos-mas-vendidos',
  verificarToken,
  requierePermiso('ver_reportes', 'ver_todo'),
  [
    query('fechaInicio').optional().isISO8601().withMessage('fechaInicio debe ser una fecha válida en formato ISO 8601'),
    query('fechaFin').optional().isISO8601().withMessage('fechaFin debe ser una fecha válida en formato ISO 8601'),
    query('limite').optional().isInt({ min: 1, max: 50 }).withMessage('limite debe ser un número entre 1 y 50')
  ],
  obtenerProductosMasVendidos
);

/**
 * @route   GET /api/dashboard/ordenes-recientes
 * @desc    Obtener las órdenes más recientes
 * @access  Privado (requiere permiso ver_reportes o ver_todo)
 */
router.get(
  '/ordenes-recientes',
  verificarToken,
  requierePermiso('ver_reportes', 'ver_todo'),
  [
    query('limite').optional().isInt({ min: 1, max: 50 }).withMessage('limite debe ser un número entre 1 y 50')
  ],
  obtenerOrdenesRecientes
);

/**
 * @route   GET /api/dashboard/items-menu
 * @desc    Obtener total de items activos en el menú
 * @access  Privado (requiere permiso ver_reportes o ver_todo)
 */
router.get(
  '/items-menu',
  verificarToken,
  requierePermiso('ver_reportes', 'ver_todo'),
  obtenerTotalItemsMenu
);

module.exports = router;
