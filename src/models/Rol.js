/**
 * Modelo de Rol con permisos granulares
 * Define los roles disponibles y sus permisos específicos
 */

class Rol {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.permisos = data.permisos || [];
    this.predeterminado = data.predeterminado || false;
  }

  // Roles disponibles en el sistema
  static ROLES = {
    DUENO: 'dueno',
    GERENTE: 'gerente',
    CAJERO: 'cajero',
    MESERO: 'mesero',
    COCINERO: 'cocinero'
  };

  // Todos los permisos disponibles en el sistema
  static PERMISOS = {
    // Permisos generales
    VER_TODO: 'ver_todo',
    
    // Permisos de usuarios
    EDITAR_TODO: 'editar_todo',
    ELIMINAR_TODO: 'eliminar_todo',
    
    // Permisos de menú
    GESTIONAR_MENU: 'gestionar_menu',
    GESTIONAR_USUARIOS: 'gestionar_usuarios',
    
    // Permisos de pedidos
    GESTIONAR_PEDIDOS: 'gestionar_pedidos',
    VER_PEDIDOS: 'ver_pedidos',
    
    // Permisos de pagos
    GESTIONAR_PAGOS: 'gestionar_pagos',
    PROCESAR_PAGOS: 'procesar_pagos',
    
    // Permisos de reportes
    VER_REPORTES: 'ver_reportes',
    
    // Permisos de mesas
    GESTIONAR_MESAS: 'gestionar_mesas',
    VER_MESAS: 'ver_mesas',
    
    // Permisos de reservaciones
    GESTIONAR_RESERVACIONES: 'gestionar_reservaciones',
    
    // Permisos de cocina
    VER_COCINA: 'ver_cocina',
    ACTUALIZAR_ESTADO_PEDIDO: 'actualizar_estado_pedido',
    VER_MENU: 'ver_menu',
    
    // Permisos de configuración
    GESTIONAR_CONFIGURACION: 'gestionar_configuracion'
  };

  /**
   * Configuración de roles predefinidos con sus permisos
   * Basado en la imagen proporcionada
   */
  static ROLES_CONFIG = {
    dueno: {
      nombre: 'Dueño',
      descripcion: 'Acceso completo a todas las funciones del sistema',
      permisos: [
        Rol.PERMISOS.VER_TODO,
        Rol.PERMISOS.EDITAR_TODO,
        Rol.PERMISOS.ELIMINAR_TODO,
        Rol.PERMISOS.GESTIONAR_USUARIOS,
        Rol.PERMISOS.GESTIONAR_MENU,
        Rol.PERMISOS.GESTIONAR_PEDIDOS,
        Rol.PERMISOS.GESTIONAR_PAGOS,
        Rol.PERMISOS.VER_REPORTES,
        Rol.PERMISOS.GESTIONAR_MESAS,
        Rol.PERMISOS.GESTIONAR_RESERVACIONES,
        Rol.PERMISOS.VER_COCINA,
        Rol.PERMISOS.GESTIONAR_CONFIGURACION
      ],
      predeterminado: true
    },
    gerente: {
      nombre: 'Gerente',
      descripcion: 'Gestión operativa del restaurante',
      permisos: [
        Rol.PERMISOS.VER_REPORTES,
        Rol.PERMISOS.GESTIONAR_MENU,
        Rol.PERMISOS.GESTIONAR_PEDIDOS,
        Rol.PERMISOS.GESTIONAR_PAGOS,
        Rol.PERMISOS.VER_COCINA,
        Rol.PERMISOS.GESTIONAR_RESERVACIONES
      ],
      predeterminado: true
    },
    cajero: {
      nombre: 'Cajero',
      descripcion: 'Gestión de pagos y caja',
      permisos: [
        Rol.PERMISOS.GESTIONAR_PAGOS,
        Rol.PERMISOS.VER_PEDIDOS,
        Rol.PERMISOS.PROCESAR_PAGOS
      ],
      predeterminado: true
    },
    mesero: {
      nombre: 'Mesero',
      descripcion: 'Toma de pedidos y atención al cliente',
      permisos: [
        Rol.PERMISOS.GESTIONAR_PEDIDOS,
        Rol.PERMISOS.VER_MENU,
        Rol.PERMISOS.VER_MESAS,
        Rol.PERMISOS.GESTIONAR_RESERVACIONES
      ],
      predeterminado: true
    },
    cocinero: {
      nombre: 'Cocinero',
      descripcion: 'Preparación de alimentos',
      permisos: [
        Rol.PERMISOS.VER_COCINA,
        Rol.PERMISOS.ACTUALIZAR_ESTADO_PEDIDO,
        Rol.PERMISOS.VER_MENU
      ],
      predeterminado: true
    }
  };

  /**
   * Obtiene la configuración de un rol específico
   * @param {string} rolId - ID del rol
   * @returns {Object|null}
   */
  static obtenerConfiguracionRol(rolId) {
    return Rol.ROLES_CONFIG[rolId] || null;
  }

  /**
   * Obtiene todos los roles disponibles
   * @returns {Array}
   */
  static obtenerTodosLosRoles() {
    return Object.keys(Rol.ROLES_CONFIG).map(key => ({
      id: key,
      ...Rol.ROLES_CONFIG[key]
    }));
  }

  /**
   * Verifica si un rol tiene un permiso específico
   * @param {string} rolId - ID del rol
   * @param {string} permiso - Permiso a verificar
   * @returns {boolean}
   */
  static tienePermiso(rolId, permiso) {
    const config = Rol.obtenerConfiguracionRol(rolId);
    if (!config) return false;
    return config.permisos.includes(permiso);
  }

  /**
   * Verifica si un rol tiene todos los permisos especificados
   * @param {string} rolId - ID del rol
   * @param {Array<string>} permisos - Lista de permisos a verificar
   * @returns {boolean}
   */
  static tieneTodosLosPermisos(rolId, permisos) {
    return permisos.every(permiso => Rol.tienePermiso(rolId, permiso));
  }

  /**
   * Verifica si un rol tiene al menos uno de los permisos especificados
   * @param {string} rolId - ID del rol
   * @param {Array<string>} permisos - Lista de permisos a verificar
   * @returns {boolean}
   */
  static tieneAlgunPermiso(rolId, permisos) {
    return permisos.some(permiso => Rol.tienePermiso(rolId, permiso));
  }

  /**
   * Obtiene los permisos de un rol
   * @param {string} rolId - ID del rol
   * @returns {Array<string>}
   */
  static obtenerPermisos(rolId) {
    const config = Rol.obtenerConfiguracionRol(rolId);
    return config ? config.permisos : [];
  }

  /**
   * Obtiene el nombre legible de un rol
   * @param {string} rolId - ID del rol
   * @returns {string}
   */
  static obtenerNombreRol(rolId) {
    const config = Rol.obtenerConfiguracionRol(rolId);
    return config ? config.nombre : rolId;
  }

  /**
   * Obtiene la descripción de un rol
   * @param {string} rolId - ID del rol
   * @returns {string}
   */
  static obtenerDescripcionRol(rolId) {
    const config = Rol.obtenerConfiguracionRol(rolId);
    return config ? config.descripcion : '';
  }

  /**
   * Valida que un rol exista
   * @param {string} rolId - ID del rol
   * @returns {boolean}
   */
  static validarRol(rolId) {
    return Object.keys(Rol.ROLES_CONFIG).includes(rolId);
  }

  /**
   * Obtiene información detallada de todos los permisos
   * @returns {Array}
   */
  static obtenerInformacionPermisos() {
    return [
      { id: Rol.PERMISOS.VER_TODO, nombre: 'Ver Todo', descripcion: 'Ver todos los registros del sistema' },
      { id: Rol.PERMISOS.EDITAR_TODO, nombre: 'Editar Todo', descripcion: 'Editar cualquier registro del sistema' },
      { id: Rol.PERMISOS.ELIMINAR_TODO, nombre: 'Eliminar Todo', descripcion: 'Eliminar cualquier registro del sistema' },
      { id: Rol.PERMISOS.GESTIONAR_USUARIOS, nombre: 'Gestionar Usuarios', descripcion: 'Crear, editar y eliminar usuarios' },
      { id: Rol.PERMISOS.GESTIONAR_MENU, nombre: 'Gestionar Menú', descripcion: 'Administrar categorías y items del menú' },
      { id: Rol.PERMISOS.GESTIONAR_PEDIDOS, nombre: 'Gestionar Pedidos', descripcion: 'Crear, modificar y cancelar pedidos' },
      { id: Rol.PERMISOS.VER_PEDIDOS, nombre: 'Ver Pedidos', descripcion: 'Ver pedidos del sistema' },
      { id: Rol.PERMISOS.GESTIONAR_PAGOS, nombre: 'Gestionar Pagos', descripcion: 'Administrar pagos y divisiones de cuenta' },
      { id: Rol.PERMISOS.PROCESAR_PAGOS, nombre: 'Procesar Pagos', descripcion: 'Procesar transacciones de pago' },
      { id: Rol.PERMISOS.VER_REPORTES, nombre: 'Ver Reportes', descripcion: 'Acceder a reportes y estadísticas' },
      { id: Rol.PERMISOS.GESTIONAR_MESAS, nombre: 'Gestionar Mesas', descripcion: 'Administrar configuración de mesas' },
      { id: Rol.PERMISOS.VER_MESAS, nombre: 'Ver Mesas', descripcion: 'Ver estado de las mesas' },
      { id: Rol.PERMISOS.GESTIONAR_RESERVACIONES, nombre: 'Gestionar Reservaciones', descripcion: 'Crear y administrar reservaciones' },
      { id: Rol.PERMISOS.VER_COCINA, nombre: 'Ver Cocina', descripcion: 'Ver pedidos en cocina' },
      { id: Rol.PERMISOS.ACTUALIZAR_ESTADO_PEDIDO, nombre: 'Actualizar Estado de Pedido', descripcion: 'Cambiar estado de preparación' },
      { id: Rol.PERMISOS.VER_MENU, nombre: 'Ver Menú', descripcion: 'Ver items del menú' },
      { id: Rol.PERMISOS.GESTIONAR_CONFIGURACION, nombre: 'Gestionar Configuración', descripcion: 'Modificar configuración del sistema' }
    ];
  }

  /**
   * Convierte el rol a formato JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      permisos: this.permisos,
      predeterminado: this.predeterminado
    };
  }
}

module.exports = Rol;
