const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');
const validarCampos = require('../middleware/validarCampos');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Público
 */
router.post(
  '/register',
  [
    body('nombreCompleto')
      .trim()
      .notEmpty()
      .withMessage('El nombre completo es requerido')
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('correoElectronico')
      .trim()
      .notEmpty()
      .withMessage('El correo electrónico es requerido')
      .isEmail()
      .withMessage('Debe ser un correo electrónico válido')
      .normalizeEmail(),
    body('rol')
      .trim()
      .notEmpty()
      .withMessage('El rol es requerido')
      .isIn(['dueno', 'gerente', 'cajero', 'mesero', 'cocinero'])
      .withMessage('Rol inválido'),
    body('contrasena')
      .trim()
      .notEmpty()
      .withMessage('La contraseña es requerida')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  validarCampos,
  authController.registrar
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Público
 */
router.post(
  '/login',
  [
    body('correoElectronico')
      .trim()
      .notEmpty()
      .withMessage('El correo electrónico es requerido')
      .isEmail()
      .withMessage('Debe ser un correo electrónico válido')
      .normalizeEmail(),
    body('contrasena')
      .trim()
      .notEmpty()
      .withMessage('La contraseña es requerida'),
  ],
  validarCampos,
  authController.iniciarSesion
);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/perfil', verificarToken, authController.obtenerPerfil);

module.exports = router;
