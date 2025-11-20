const express = require('express');
const { body } = require('express-validator');
const {
  obtenerConfiguracion,
  actualizarRestaurante,
  actualizarNotificaciones,
  actualizarImpuestos,
  actualizarPropinas
} = require('../controllers/configuracionController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/configuracion
 * @desc    Obtener la configuración actual del restaurante
 * @access  Privado (requiere token)
 */
router.get('/', verificarToken, obtenerConfiguracion);

/**
 * @route   PUT /api/configuracion/restaurante
 * @desc    Actualizar información del restaurante
 * @access  Privado (admin o gerente)
 */
router.put(
  '/restaurante',
  verificarToken,
  [
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('direccion')
      .optional()
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('La dirección debe tener entre 10 y 200 caracteres'),
    body('telefono')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('El teléfono no puede estar vacío'),
    body('numeroMesas')
      .optional()
      .isInt({ min: 0, max: 500 })
      .withMessage('El número de mesas debe estar entre 0 y 500')
  ],
  actualizarRestaurante
);

/**
 * @route   PUT /api/configuracion/notificaciones
 * @desc    Actualizar configuración de notificaciones
 * @access  Privado (admin o gerente)
 */
router.put(
  '/notificaciones',
  verificarToken,
  [
    body('nuevasOrdenes')
      .optional()
      .isBoolean()
      .withMessage('nuevasOrdenes debe ser un valor booleano'),
    body('nuevasReservaciones')
      .optional()
      .isBoolean()
      .withMessage('nuevasReservaciones debe ser un valor booleano')
  ],
  actualizarNotificaciones
);

/**
 * @route   PUT /api/configuracion/impuestos
 * @desc    Actualizar configuración de impuestos
 * @access  Privado (admin o gerente)
 */
router.put(
  '/impuestos',
  verificarToken,
  [
    body('porcentajeIVA')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('El porcentaje de IVA debe estar entre 0 y 100'),
    body('aplicarATodos')
      .optional()
      .isBoolean()
      .withMessage('aplicarATodos debe ser un valor booleano')
  ],
  actualizarImpuestos
);

/**
 * @route   PUT /api/configuracion/propinas
 * @desc    Actualizar opciones de propina
 * @access  Privado (admin o gerente)
 */
router.put(
  '/propinas',
  verificarToken,
  [
    body('opcion1')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('La opción 1 debe estar entre 0 y 100'),
    body('opcion2')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('La opción 2 debe estar entre 0 y 100'),
    body('opcion3')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('La opción 3 debe estar entre 0 y 100'),
    body('permitirPersonalizada')
      .optional()
      .isBoolean()
      .withMessage('permitirPersonalizada debe ser un valor booleano')
  ],
  actualizarPropinas
);

module.exports = router;
