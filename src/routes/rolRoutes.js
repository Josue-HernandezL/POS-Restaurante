const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const rolController = require('../controllers/rolController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/roles/permisos
 * @desc    Obtiene todos los permisos disponibles en el sistema
 * @access  Privado - Cualquier usuario autenticado
 */
router.get('/permisos', rolController.obtenerPermisos);

/**
 * @route   GET /api/roles
 * @desc    Obtiene todos los roles con sus permisos
 * @access  Privado - Cualquier usuario autenticado
 */
router.get('/', rolController.obtenerRoles);

/**
 * @route   GET /api/roles/:id
 * @desc    Obtiene un rol específico con sus permisos
 * @access  Privado - Cualquier usuario autenticado
 */
router.get(
  '/:id',
  [
    param('id')
      .notEmpty().withMessage('El ID del rol es requerido')
      .isIn(['dueno', 'gerente', 'cajero', 'mesero', 'cocinero']).withMessage('Rol inválido')
  ],
  rolController.obtenerRolPorId
);

/**
 * @route   GET /api/roles/:id/permisos
 * @desc    Obtiene los permisos de un rol específico
 * @access  Privado - Cualquier usuario autenticado
 */
router.get(
  '/:id/permisos',
  [
    param('id')
      .notEmpty().withMessage('El ID del rol es requerido')
      .isIn(['dueno', 'gerente', 'cajero', 'mesero', 'cocinero']).withMessage('Rol inválido')
  ],
  rolController.obtenerPermisosDeRol
);

/**
 * @route   GET /api/roles/:id/verificar-permiso/:permiso
 * @desc    Verifica si un rol tiene un permiso específico
 * @access  Privado - Cualquier usuario autenticado
 */
router.get(
  '/:id/verificar-permiso/:permiso',
  [
    param('id')
      .notEmpty().withMessage('El ID del rol es requerido')
      .isIn(['dueno', 'gerente', 'cajero', 'mesero', 'cocinero']).withMessage('Rol inválido'),
    param('permiso')
      .notEmpty().withMessage('El permiso es requerido')
  ],
  rolController.verificarPermiso
);

module.exports = router;
