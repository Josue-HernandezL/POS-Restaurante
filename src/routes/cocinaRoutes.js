const express = require('express');
const { body } = require('express-validator');
const {
  obtenerPedidosCocina,
  obtenerDetallePedidoCocina,
  iniciarPreparacion,
  marcarPedidoListo,
  cambiarEstadoCocina,
  obtenerEstadisticasCocina
} = require('../controllers/cocinaController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/cocina/pedidos
 * @desc    Obtener todos los pedidos activos para cocina
 * @access  Privado (requiere token)
 * @query   estado (opcional): pendiente, en_preparacion, listo
 */
router.get('/pedidos', verificarToken, obtenerPedidosCocina);

/**
 * @route   GET /api/cocina/estadisticas
 * @desc    Obtener estadísticas de cocina
 * @access  Privado (requiere token)
 * @query   fecha (opcional): YYYY-MM-DD
 */
router.get('/estadisticas', verificarToken, obtenerEstadisticasCocina);

/**
 * @route   PATCH /api/cocina/pedidos/:id/iniciar
 * @desc    Iniciar preparación de un pedido (pendiente -> en_preparacion)
 * @access  Privado (requiere token)
 */
router.patch('/pedidos/:id/iniciar', verificarToken, iniciarPreparacion);

/**
 * @route   PATCH /api/cocina/pedidos/:id/listo
 * @desc    Marcar pedido como listo (en_preparacion -> listo)
 * @access  Privado (requiere token)
 */
router.patch('/pedidos/:id/listo', verificarToken, marcarPedidoListo);

/**
 * @route   PATCH /api/cocina/pedidos/:id/estado
 * @desc    Cambiar estado del pedido desde cocina
 * @access  Privado (requiere token)
 */
router.patch(
  '/pedidos/:id/estado',
  verificarToken,
  [
    body('estado')
      .notEmpty()
      .withMessage('El estado es requerido')
      .isIn(['pendiente', 'en_preparacion', 'listo'])
      .withMessage('Estado inválido. Debe ser: pendiente, en_preparacion o listo')
  ],
  cambiarEstadoCocina
);

/**
 * @route   GET /api/cocina/pedidos/:id
 * @desc    Obtener detalles de un pedido específico
 * @access  Privado (requiere token)
 */
router.get('/pedidos/:id', verificarToken, obtenerDetallePedidoCocina);

module.exports = router;
