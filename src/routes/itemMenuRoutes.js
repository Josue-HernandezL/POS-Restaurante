const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const itemMenuController = require('../controllers/itemMenuController');
const { verificarToken, verificarRol } = require('../middleware/auth');

/**
 * @route   POST /api/items
 * @desc    Crear un nuevo ítem del menú
 * @access  Privado (admin, gerente)
 */
router.post(
  '/',
  verificarToken,
  verificarRol('admin', 'gerente'),
  [
    body('nombre')
      .trim()
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('categoriaId')
      .trim()
      .notEmpty()
      .withMessage('La categoría es requerida'),
    body('precio')
      .notEmpty()
      .withMessage('El precio es requerido')
      .isFloat({ min: 0 })
      .withMessage('El precio debe ser un número mayor o igual a 0'),
    body('disponibilidad')
      .optional()
      .isBoolean()
      .withMessage('La disponibilidad debe ser un booleano'),
    body('descripcion')
      .trim()
      .notEmpty()
      .withMessage('La descripción es requerida')
      .isLength({ max: 300 })
      .withMessage('La descripción no puede exceder 300 caracteres'),
  ],
  itemMenuController.crearItem
);

/**
 * @route   GET /api/items
 * @desc    Obtener todos los ítems del menú
 * @access  Privado
 */
router.get(
  '/',
  verificarToken,
  itemMenuController.obtenerItems
);

/**
 * @route   GET /api/items/:id
 * @desc    Obtener un ítem por ID
 * @access  Privado
 */
router.get(
  '/:id',
  verificarToken,
  itemMenuController.obtenerItemPorId
);

/**
 * @route   PUT /api/items/:id
 * @desc    Actualizar un ítem
 * @access  Privado (admin, gerente)
 */
router.put(
  '/:id',
  verificarToken,
  verificarRol('admin', 'gerente'),
  [
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('categoriaId')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('La categoría no puede estar vacía'),
    body('precio')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El precio debe ser un número mayor o igual a 0'),
    body('disponibilidad')
      .optional()
      .isBoolean()
      .withMessage('La disponibilidad debe ser un booleano'),
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('La descripción no puede exceder 300 caracteres'),
    body('activo')
      .optional()
      .isBoolean()
      .withMessage('El campo activo debe ser un booleano'),
  ],
  itemMenuController.actualizarItem
);

/**
 * @route   DELETE /api/items/:id
 * @desc    Eliminar un ítem (soft delete)
 * @access  Privado (admin, gerente)
 */
router.delete(
  '/:id',
  verificarToken,
  verificarRol('admin', 'gerente'),
  itemMenuController.eliminarItem
);

module.exports = router;
