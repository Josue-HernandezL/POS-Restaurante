const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reservacionController = require('../controllers/reservacionController');
const { verificarToken, verificarRol } = require('../middleware/auth');

/**
 * @route   POST /api/reservaciones
 * @desc    Crear una nueva reservación
 * @access  Privado
 */
router.post(
  '/',
  verificarToken,
  [
    body('nombreCliente')
      .trim()
      .notEmpty()
      .withMessage('El nombre del cliente es requerido')
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('telefono')
      .trim()
      .notEmpty()
      .withMessage('El teléfono es requerido'),
    body('fecha')
      .notEmpty()
      .withMessage('La fecha es requerida')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('La fecha debe estar en formato YYYY-MM-DD'),
    body('hora')
      .notEmpty()
      .withMessage('La hora es requerida')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('La hora debe estar en formato HH:MM'),
    body('numeroPersonas')
      .notEmpty()
      .withMessage('El número de personas es requerido')
      .isInt({ min: 1, max: 20 })
      .withMessage('El número de personas debe ser entre 1 y 20'),
    body('mesaAsignada')
      .trim()
      .notEmpty()
      .withMessage('La mesa asignada es requerida'),
    body('notas')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Las notas no pueden exceder 500 caracteres'),
  ],
  reservacionController.crearReservacion
);

/**
 * @route   GET /api/reservaciones
 * @desc    Obtener todas las reservaciones
 * @access  Privado
 */
router.get(
  '/',
  verificarToken,
  reservacionController.obtenerReservaciones
);

/**
 * @route   GET /api/reservaciones/:id
 * @desc    Obtener una reservación por ID
 * @access  Privado
 */
router.get(
  '/:id',
  verificarToken,
  reservacionController.obtenerReservacionPorId
);

/**
 * @route   PUT /api/reservaciones/:id
 * @desc    Actualizar una reservación
 * @access  Privado
 */
router.put(
  '/:id',
  verificarToken,
  [
    body('nombreCliente')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('telefono')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('El teléfono no puede estar vacío'),
    body('fecha')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('La fecha debe estar en formato YYYY-MM-DD'),
    body('hora')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('La hora debe estar en formato HH:MM'),
    body('numeroPersonas')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('El número de personas debe ser entre 1 y 20'),
    body('mesaAsignada')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('La mesa asignada no puede estar vacía'),
    body('notas')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Las notas no pueden exceder 500 caracteres'),
    body('estado')
      .optional()
      .isIn(['pendiente', 'confirmada', 'sentada', 'terminada', 'cancelada'])
      .withMessage('Estado inválido'),
  ],
  reservacionController.actualizarReservacion
);

/**
 * @route   PATCH /api/reservaciones/:id/sentar
 * @desc    Marcar reservación como sentada
 * @access  Privado
 */
router.patch(
  '/:id/sentar',
  verificarToken,
  reservacionController.marcarComoSentada
);

/**
 * @route   PATCH /api/reservaciones/:id/terminar
 * @desc    Marcar reservación como terminada
 * @access  Privado
 */
router.patch(
  '/:id/terminar',
  verificarToken,
  reservacionController.marcarComoTerminada
);

/**
 * @route   PATCH /api/reservaciones/:id/cancelar
 * @desc    Cancelar reservación
 * @access  Privado
 */
router.patch(
  '/:id/cancelar',
  verificarToken,
  reservacionController.cancelarReservacion
);

module.exports = router;
