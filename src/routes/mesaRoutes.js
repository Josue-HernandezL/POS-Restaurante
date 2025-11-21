const express = require('express');
const { body } = require('express-validator');
const {
  inicializarMesas,
  obtenerMesas,
  obtenerMesaPorId,
  actualizarMesa,
  cambiarEstadoMesa,
  eliminarMesa
} = require('../controllers/mesaController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/mesas/inicializar
 * @desc    Inicializar mesas basándose en la configuración
 * @access  Privado (admin o gerente)
 */
router.post('/inicializar', verificarToken, inicializarMesas);

/**
 * @route   GET /api/mesas
 * @desc    Obtener todas las mesas (con filtros opcionales)
 * @access  Privado (requiere token)
 */
router.get('/', verificarToken, obtenerMesas);

/**
 * @route   GET /api/mesas/:id
 * @desc    Obtener una mesa por ID
 * @access  Privado (requiere token)
 */
router.get('/:id', verificarToken, obtenerMesaPorId);

/**
 * @route   PUT /api/mesas/:id
 * @desc    Actualizar una mesa
 * @access  Privado (admin o gerente)
 */
router.put(
  '/:id',
  verificarToken,
  [
    body('numeroMesa')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('El número de mesa no puede estar vacío')
      .isLength({ min: 1, max: 50 })
      .withMessage('El número de mesa debe tener entre 1 y 50 caracteres'),
    body('capacidad')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('La capacidad debe estar entre 1 y 20 personas'),
    body('seccion')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('La sección no puede estar vacía')
      .isLength({ min: 3, max: 100 })
      .withMessage('La sección debe tener entre 3 y 100 caracteres'),
    body('estado')
      .optional()
      .isIn(['libre', 'ocupada', 'reservada', 'en_limpieza'])
      .withMessage('El estado debe ser: libre, ocupada, reservada o en_limpieza'),
    body('activo')
      .optional()
      .isBoolean()
      .withMessage('El campo activo debe ser un valor booleano')
  ],
  actualizarMesa
);

/**
 * @route   PATCH /api/mesas/:id/estado
 * @desc    Cambiar el estado de una mesa
 * @access  Privado (requiere token)
 */
router.patch(
  '/:id/estado',
  verificarToken,
  [
    body('estado')
      .notEmpty()
      .withMessage('El estado es requerido')
      .isIn(['libre', 'ocupada', 'reservada', 'en_limpieza'])
      .withMessage('El estado debe ser: libre, ocupada, reservada o en_limpieza')
  ],
  cambiarEstadoMesa
);

/**
 * @route   DELETE /api/mesas/:id
 * @desc    Eliminar una mesa (soft delete)
 * @access  Privado (admin o gerente)
 */
router.delete('/:id', verificarToken, eliminarMesa);

module.exports = router;
