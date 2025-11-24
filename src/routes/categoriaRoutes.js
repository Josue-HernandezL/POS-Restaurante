const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const categoriaController = require('../controllers/categoriaController');
const { verificarToken, verificarRol } = require('../middleware/auth');
const validarCampos = require('../middleware/validarCampos');

/**
 * @route   POST /api/categorias
 * @desc    Crear una nueva categoría
 * @access  Privado (admin, gerente)
 */
router.post(
  '/',
  verificarToken,
  verificarRol('dueno', 'gerente'),
  [
    body('nombre')
      .trim()
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ min: 3, max: 50 })
      .withMessage('El nombre debe tener entre 3 y 50 caracteres'),
    body('descripcion')
      .trim()
      .notEmpty()
      .withMessage('La descripción es requerida')
      .isLength({ max: 200 })
      .withMessage('La descripción no puede exceder 200 caracteres'),
  ],
  validarCampos,
  categoriaController.crearCategoria
);

/**
 * @route   GET /api/categorias
 * @desc    Obtener todas las categorías
 * @access  Privado
 */
router.get(
  '/',
  verificarToken,
  categoriaController.obtenerCategorias
);

/**
 * @route   GET /api/categorias/:id
 * @desc    Obtener una categoría por ID
 * @access  Privado
 */
router.get(
  '/:id',
  verificarToken,
  categoriaController.obtenerCategoriaPorId
);

/**
 * @route   PUT /api/categorias/:id
 * @desc    Actualizar una categoría
 * @access  Privado (admin, gerente)
 */
router.put(
  '/:id',
  verificarToken,
  verificarRol('dueno', 'gerente'),
  [
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('El nombre debe tener entre 3 y 50 caracteres'),
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('La descripción no puede exceder 200 caracteres'),
    body('activo')
      .optional()
      .isBoolean()
      .withMessage('El campo activo debe ser un booleano'),
  ],
  validarCampos,
  categoriaController.actualizarCategoria
);

/**
 * @route   DELETE /api/categorias/:id
 * @desc    Eliminar una categoría (eliminación física)
 * @access  Privado (admin, gerente)
 */
router.delete(
  '/:id',
  verificarToken,
  verificarRol('dueno', 'gerente'),
  categoriaController.eliminarCategoria
);

module.exports = router;
