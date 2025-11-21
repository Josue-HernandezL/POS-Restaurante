const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const usuarioController = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/auth');
const { requierePermiso } = require('../middleware/permisos');
const Rol = require('../models/Rol');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   POST /api/usuarios
 * @desc    Crea un nuevo usuario
 * @access  Privado - Requiere permiso MANAGE_USERS
 */
router.post(
  '/',
  requierePermiso(Rol.PERMISOS.GESTIONAR_USUARIOS),
  [
    body('nombre')
      .notEmpty().withMessage('El nombre es requerido')
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('correo')
      .notEmpty().withMessage('El correo es requerido')
      .isEmail().withMessage('Debe ser un correo electrónico válido')
      .normalizeEmail(),
    body('rol')
      .notEmpty().withMessage('El rol es requerido')
      .isIn(['dueno', 'gerente', 'cajero', 'mesero', 'cocinero']).withMessage('Rol inválido'),
    body('pinSeguridad')
      .notEmpty().withMessage('El PIN de seguridad es requerido')
      .isNumeric().withMessage('El PIN debe ser numérico')
      .isLength({ min: 4, max: 6 }).withMessage('El PIN debe tener entre 4 y 6 dígitos'),
    body('activo')
      .optional()
      .isBoolean().withMessage('El campo activo debe ser booleano')
  ],
  usuarioController.crearUsuario
);

/**
 * @route   GET /api/usuarios
 * @desc    Obtiene todos los usuarios
 * @access  Privado - Requiere permiso MANAGE_USERS o VIEW_ALL
 */
router.get(
  '/',
  requierePermiso([Rol.PERMISOS.GESTIONAR_USUARIOS, Rol.PERMISOS.VER_TODO]),
  usuarioController.obtenerUsuarios
);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtiene un usuario por ID
 * @access  Privado - Requiere permiso MANAGE_USERS o VIEW_ALL
 */
router.get(
  '/:id',
  requierePermiso([Rol.PERMISOS.GESTIONAR_USUARIOS, Rol.PERMISOS.VER_TODO]),
  [
    param('id').notEmpty().withMessage('El ID del usuario es requerido')
  ],
  usuarioController.obtenerUsuarioPorId
);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualiza un usuario
 * @access  Privado - Requiere permiso MANAGE_USERS o EDIT_ALL
 */
router.put(
  '/:id',
  requierePermiso([Rol.PERMISOS.GESTIONAR_USUARIOS, Rol.PERMISOS.EDITAR_TODO]),
  [
    param('id').notEmpty().withMessage('El ID del usuario es requerido'),
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('correo')
      .optional()
      .isEmail().withMessage('Debe ser un correo electrónico válido')
      .normalizeEmail(),
    body('rol')
      .optional()
      .isIn(['dueno', 'gerente', 'cajero', 'mesero', 'cocinero']).withMessage('Rol inválido'),
    body('pinSeguridad')
      .optional()
      .isNumeric().withMessage('El PIN debe ser numérico')
      .isLength({ min: 4, max: 6 }).withMessage('El PIN debe tener entre 4 y 6 dígitos'),
    body('activo')
      .optional()
      .isBoolean().withMessage('El campo activo debe ser booleano')
  ],
  usuarioController.actualizarUsuario
);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Elimina un usuario
 * @access  Privado - Requiere permiso MANAGE_USERS o DELETE_ALL
 */
router.delete(
  '/:id',
  requierePermiso([Rol.PERMISOS.GESTIONAR_USUARIOS, Rol.PERMISOS.ELIMINAR_TODO]),
  [
    param('id').notEmpty().withMessage('El ID del usuario es requerido')
  ],
  usuarioController.eliminarUsuario
);

/**
 * @route   POST /api/usuarios/:id/verificar-pin
 * @desc    Verifica el PIN de seguridad de un usuario
 * @access  Privado - Cualquier usuario autenticado
 */
router.post(
  '/:id/verificar-pin',
  [
    param('id').notEmpty().withMessage('El ID del usuario es requerido'),
    body('pin')
      .notEmpty().withMessage('El PIN es requerido')
      .isNumeric().withMessage('El PIN debe ser numérico')
      .isLength({ min: 4, max: 6 }).withMessage('El PIN debe tener entre 4 y 6 dígitos')
  ],
  usuarioController.verificarPin
);

module.exports = router;
