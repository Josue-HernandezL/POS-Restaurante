const express = require('express');
const { body } = require('express-validator');
const {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  cambiarEstadoPedido,
  cancelarPedido,
  eliminarPedido
} = require('../controllers/pedidoController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/pedidos
 * @desc    Crear un nuevo pedido
 * @access  Privado (requiere token)
 */
router.post(
  '/',
  verificarToken,
  [
    body('mesaId')
      .notEmpty()
      .withMessage('El ID de la mesa es requerido')
      .trim(),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Debe incluir al menos un item en el pedido'),
    body('items.*.itemId')
      .notEmpty()
      .withMessage('El ID del item es requerido')
      .trim(),
    body('items.*.cantidad')
      .isInt({ min: 1 })
      .withMessage('La cantidad debe ser al menos 1'),
    body('items.*.observaciones')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Las observaciones del item no pueden exceder 200 caracteres'),
    body('observaciones')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Las observaciones del pedido no pueden exceder 500 caracteres')
  ],
  crearPedido
);

/**
 * @route   GET /api/pedidos
 * @desc    Obtener todos los pedidos (con filtros opcionales)
 * @access  Privado (requiere token)
 */
router.get('/', verificarToken, obtenerPedidos);

/**
 * @route   GET /api/pedidos/:id
 * @desc    Obtener un pedido por ID
 * @access  Privado (requiere token)
 */
router.get('/:id', verificarToken, obtenerPedidoPorId);

/**
 * @route   PUT /api/pedidos/:id
 * @desc    Actualizar un pedido (solo en estado pendiente)
 * @access  Privado (requiere token)
 */
router.put(
  '/:id',
  verificarToken,
  [
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Debe incluir al menos un item en el pedido'),
    body('items.*.itemId')
      .optional()
      .notEmpty()
      .withMessage('El ID del item es requerido')
      .trim(),
    body('items.*.cantidad')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La cantidad debe ser al menos 1'),
    body('items.*.observaciones')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Las observaciones del item no pueden exceder 200 caracteres'),
    body('observaciones')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Las observaciones del pedido no pueden exceder 500 caracteres')
  ],
  actualizarPedido
);

/**
 * @route   PATCH /api/pedidos/:id/estado
 * @desc    Cambiar el estado de un pedido
 * @access  Privado (requiere token)
 */
router.patch(
  '/:id/estado',
  verificarToken,
  [
    body('estado')
      .notEmpty()
      .withMessage('El estado es requerido')
      .isIn(['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'])
      .withMessage('Estado inválido')
  ],
  cambiarEstadoPedido
);

/**
 * @route   PATCH /api/pedidos/:id/cancelar
 * @desc    Cancelar un pedido
 * @access  Privado (requiere token)
 */
router.patch('/:id/cancelar', verificarToken, cancelarPedido);

/**
 * @route   DELETE /api/pedidos/:id
 * @desc    Eliminar un pedido (soft delete)
 * @access  Privado (admin o gerente)
 */
router.delete('/:id', verificarToken, eliminarPedido);

module.exports = router;
