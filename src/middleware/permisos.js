const Rol = require('../models/Rol');
const { db } = require('../config/firebase');
const Autorizacion = require('../models/Autorizacion');

/**
 * Middleware para verificar que el usuario tiene un permiso específico
 * @param {string|Array<string>} permisosRequeridos - Permiso(s) requerido(s)
 * @returns {Function} Middleware
 */
const requierePermiso = (permisosRequeridos) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.usuario) {
        return res.status(401).json({
          exito: false,
          mensaje: 'No autenticado'
        });
      }

      // Obtener el rol del usuario
      const rolUsuario = req.usuario.rol;

      if (!rolUsuario) {
        return res.status(403).json({
          exito: false,
          mensaje: 'El usuario no tiene un rol asignado'
        });
      }

      // Si es admin, permitir acceso completo
      if (rolUsuario === 'admin') {
        return next();
      }

      // Convertir a array si es un solo permiso
      const permisos = Array.isArray(permisosRequeridos) ? permisosRequeridos : [permisosRequeridos];

      // Verificar si el usuario tiene al menos uno de los permisos requeridos
      const tienePermiso = Rol.tieneAlgunPermiso(rolUsuario, permisos);

      if (!tienePermiso) {
        // Registrar intento de acceso denegado
        const autorizacion = new Autorizacion({
          accion: Autorizacion.ACCIONES.INTENTO_ACCESO_DENEGADO,
          modulo: obtenerModuloDeRuta(req.path),
          usuarioId: req.usuario.uid,
          usuarioNombre: req.usuario.correoElectronico || req.usuario.email,
          usuarioRol: rolUsuario,
          detalles: {
            ruta: req.path,
            metodo: req.method,
            permisosRequeridos: permisos,
            permisosUsuario: Rol.obtenerPermisos(rolUsuario)
          },
          ipAddress: req.ip,
          resultado: Autorizacion.RESULTADOS.FALLIDO,
          autorizado: false
        });

        await db.collection('autorizaciones').add(autorizacion.toFirestore());

        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes permisos para realizar esta acción',
          permisosRequeridos: permisos
        });
      }

      // El usuario tiene el permiso, continuar
      next();

    } catch (error) {
      console.error('Error en middleware de permisos:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar que el usuario tiene TODOS los permisos especificados
 * @param {Array<string>} permisosRequeridos - Lista de permisos requeridos
 * @returns {Function} Middleware
 */
const requiereTodosLosPermisos = (permisosRequeridos) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          exito: false,
          mensaje: 'No autenticado'
        });
      }

      const rolUsuario = req.usuario.rol;

      if (!rolUsuario) {
        return res.status(403).json({
          exito: false,
          mensaje: 'El usuario no tiene un rol asignado'
        });
      }

      // Si es admin, permitir acceso completo
      if (rolUsuario === 'admin') {
        return next();
      }

      // Verificar si el usuario tiene TODOS los permisos requeridos
      const tieneTodosLosPermisos = Rol.tieneTodosLosPermisos(rolUsuario, permisosRequeridos);

      if (!tieneTodosLosPermisos) {
        // Registrar intento de acceso denegado
        const autorizacion = new Autorizacion({
          accion: Autorizacion.ACCIONES.INTENTO_ACCESO_DENEGADO,
          modulo: obtenerModuloDeRuta(req.path),
          usuarioId: req.usuario.uid,
          usuarioNombre: req.usuario.correoElectronico || req.usuario.email,
          usuarioRol: rolUsuario,
          detalles: {
            ruta: req.path,
            metodo: req.method,
            permisosRequeridos,
            permisosUsuario: Rol.obtenerPermisos(rolUsuario)
          },
          ipAddress: req.ip,
          resultado: Autorizacion.RESULTADOS.FALLIDO,
          autorizado: false
        });

        await db.collection('autorizaciones').add(autorizacion.toFirestore());

        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes todos los permisos necesarios para realizar esta acción',
          permisosRequeridos
        });
      }

      next();

    } catch (error) {
      console.error('Error en middleware de permisos:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar que el usuario tiene un rol específico
 * @param {string|Array<string>} rolesPermitidos - Rol(es) permitido(s)
 * @returns {Function} Middleware
 */
const requiereRol = (rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          exito: false,
          mensaje: 'No autenticado'
        });
      }

      const rolUsuario = req.usuario.rol;

      if (!rolUsuario) {
        return res.status(403).json({
          exito: false,
          mensaje: 'El usuario no tiene un rol asignado'
        });
      }

      // Si es admin, permitir acceso completo
      if (rolUsuario === 'admin') {
        return next();
      }

      // Convertir a array si es un solo rol
      const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

      // Verificar si el usuario tiene uno de los roles permitidos
      if (!roles.includes(rolUsuario)) {
        // Registrar intento de acceso denegado
        const autorizacion = new Autorizacion({
          accion: Autorizacion.ACCIONES.INTENTO_ACCESO_DENEGADO,
          modulo: obtenerModuloDeRuta(req.path),
          usuarioId: req.usuario.uid,
          usuarioNombre: req.usuario.correoElectronico || req.usuario.email,
          usuarioRol: rolUsuario,
          detalles: {
            ruta: req.path,
            metodo: req.method,
            rolesPermitidos: roles,
            rolUsuario
          },
          ipAddress: req.ip,
          resultado: Autorizacion.RESULTADOS.FALLIDO,
          autorizado: false
        });

        await db.collection('autorizaciones').add(autorizacion.toFirestore());

        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes el rol necesario para realizar esta acción',
          rolesPermitidos: roles
        });
      }

      next();

    } catch (error) {
      console.error('Error en middleware de roles:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al verificar roles',
        error: error.message
      });
    }
  };
};

/**
 * Obtiene el módulo del sistema basado en la ruta
 * @param {string} ruta - Ruta de la petición
 * @returns {string} Módulo identificado
 */
function obtenerModuloDeRuta(ruta) {
  if (ruta.includes('/usuarios')) return Autorizacion.MODULOS.USUARIOS;
  if (ruta.includes('/pedidos')) return Autorizacion.MODULOS.PEDIDOS;
  if (ruta.includes('/pagos')) return Autorizacion.MODULOS.PAGOS;
  if (ruta.includes('/menu') || ruta.includes('/categorias') || ruta.includes('/items')) return Autorizacion.MODULOS.MENU;
  if (ruta.includes('/mesas')) return Autorizacion.MODULOS.MESAS;
  if (ruta.includes('/reservaciones')) return Autorizacion.MODULOS.RESERVACIONES;
  if (ruta.includes('/configuracion')) return Autorizacion.MODULOS.CONFIGURACION;
  if (ruta.includes('/reportes')) return Autorizacion.MODULOS.REPORTES;
  if (ruta.includes('/cocina')) return Autorizacion.MODULOS.COCINA;
  return 'desconocido';
}

module.exports = {
  requierePermiso,
  requiereTodosLosPermisos,
  requiereRol
};
