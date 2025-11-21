const Rol = require('../models/Rol');

/**
 * Obtiene todos los roles disponibles con sus permisos
 * @route GET /api/roles
 */
const obtenerRoles = async (req, res) => {
  try {
    const roles = Rol.obtenerTodosLosRoles();

    res.json({
      exito: true,
      datos: roles,
      total: roles.length
    });

  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener roles',
      error: error.message
    });
  }
};

/**
 * Obtiene un rol específico con sus permisos
 * @route GET /api/roles/:id
 */
const obtenerRolPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const config = Rol.obtenerConfiguracionRol(id);

    if (!config) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Rol no encontrado'
      });
    }

    res.json({
      exito: true,
      datos: {
        id,
        ...config
      }
    });

  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener rol',
      error: error.message
    });
  }
};

/**
 * Obtiene todos los permisos disponibles en el sistema
 * @route GET /api/roles/permisos
 */
const obtenerPermisos = async (req, res) => {
  try {
    const permisos = Rol.obtenerInformacionPermisos();

    res.json({
      exito: true,
      datos: permisos,
      total: permisos.length
    });

  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener permisos',
      error: error.message
    });
  }
};

/**
 * Verifica si un rol tiene un permiso específico
 * @route GET /api/roles/:id/verificar-permiso/:permiso
 */
const verificarPermiso = async (req, res) => {
  try {
    const { id, permiso } = req.params;

    // Validar que el rol existe
    if (!Rol.validarRol(id)) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Rol no encontrado'
      });
    }

    const tienePermiso = Rol.tienePermiso(id, permiso);

    res.json({
      exito: true,
      datos: {
        rol: id,
        nombreRol: Rol.obtenerNombreRol(id),
        permiso,
        tienePermiso
      }
    });

  } catch (error) {
    console.error('Error al verificar permiso:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar permiso',
      error: error.message
    });
  }
};

/**
 * Obtiene los permisos de un rol específico
 * @route GET /api/roles/:id/permisos
 */
const obtenerPermisosDeRol = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el rol existe
    if (!Rol.validarRol(id)) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Rol no encontrado'
      });
    }

    const permisos = Rol.obtenerPermisos(id);
    const informacionPermisos = Rol.obtenerInformacionPermisos();
    
    // Filtrar solo los permisos que tiene el rol
    const permisosDelRol = informacionPermisos.filter(p => permisos.includes(p.id));

    res.json({
      exito: true,
      datos: {
        rol: id,
        nombreRol: Rol.obtenerNombreRol(id),
        descripcionRol: Rol.obtenerDescripcionRol(id),
        permisos: permisosDelRol,
        totalPermisos: permisosDelRol.length
      }
    });

  } catch (error) {
    console.error('Error al obtener permisos del rol:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener permisos del rol',
      error: error.message
    });
  }
};

module.exports = {
  obtenerRoles,
  obtenerRolPorId,
  obtenerPermisos,
  verificarPermiso,
  obtenerPermisosDeRol
};
