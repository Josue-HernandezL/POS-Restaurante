const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const {
  obtenerCuentaPorMesa,
  dividirCuenta,
  procesarPago,
  obtenerPagos,
  obtenerPagoPorId
} = require('../controllers/pagoController');

/**
 * @route   GET /api/pagos/mesas/:mesaId/cuenta
 * @desc    Obtener cuenta de una mesa con opciones de propina
 * @access  Privado (requiere token)
 */
router.get('/mesas/:mesaId/cuenta', verificarToken, obtenerCuentaPorMesa);

/**
 * @route   POST /api/pagos/dividir-cuenta
 * @desc    Dividir cuenta entre varias personas
 * @access  Privado (requiere token)
 */
router.post(
  '/dividir-cuenta',
  verificarToken,
  [
    body('mesaId')
      .notEmpty()
      .withMessage('El ID de la mesa es requerido'),
    body('numeroDivisiones')
      .notEmpty()
      .withMessage('El número de divisiones es requerido')
      .isInt({ min: 2, max: 20 })
      .withMessage('El número de divisiones debe estar entre 2 y 20'),
    body('divisiones')
      .notEmpty()
      .withMessage('Las divisiones son requeridas')
      .isArray()
      .withMessage('Las divisiones deben ser un array')
  ],
  dividirCuenta
);

/**
 * @route   POST /api/pagos/procesar
 * @desc    Procesar pago de una mesa
 * @access  Privado (requiere token)
 */
router.post(
  '/procesar',
  verificarToken,
  [
    body('mesaId')
      .notEmpty()
      .withMessage('El ID de la mesa es requerido'),
    body('metodoPago')
      .notEmpty()
      .withMessage('El método de pago es requerido')
      .isIn(['efectivo', 'transferencia', 'tarjeta'])
      .withMessage('Método de pago inválido. Debe ser: efectivo, transferencia o tarjeta')
  ],
  procesarPago
);

/**
 * @route   GET /api/pagos
 * @desc    Obtener historial de pagos
 * @access  Privado (requiere token)
 * @query   fecha (opcional): YYYY-MM-DD
 * @query   metodoPago (opcional): efectivo, transferencia, tarjeta
 * @query   mesaId (opcional): ID de la mesa
 */
router.get('/', verificarToken, obtenerPagos);

/**
 * @route   GET /api/pagos/:id
 * @desc    Obtener detalle de un pago específico
 * @access  Privado (requiere token)
 */
router.get('/:id', verificarToken, obtenerPagoPorId);

module.exports = router;
