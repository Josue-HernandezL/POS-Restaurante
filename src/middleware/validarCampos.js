const { validationResult } = require('express-validator');

/**
 * Middleware genérico para manejar resultados de express-validator
 */
const validarCampos = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Datos inválidos',
      errores: errores.array(),
    });
  }

  next();
};

module.exports = validarCampos;
