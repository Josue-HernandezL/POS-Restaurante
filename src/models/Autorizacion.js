/**
 * Modelo de Autorización para registro de auditoría
 * Registra todas las acciones que requieren autorización especial
 */

class Autorizacion {
  constructor(data) {
    this.id = data.id || null;
    this.fechaHora = data.fechaHora || new Date().toISOString();
    this.accion = data.accion; // Descripción de la acción realizada
    this.modulo = data.modulo; // Módulo del sistema (usuarios, pedidos, pagos, etc.)
    this.usuarioId = data.usuarioId; // ID del usuario que realizó la acción
    this.usuarioNombre = data.usuarioNombre; // Nombre del usuario
    this.usuarioRol = data.usuarioRol; // Rol del usuario
    this.autorizadoPorId = data.autorizadoPorId || null; // ID de quien autorizó (si aplica)
    this.autorizadoPorNombre = data.autorizadoPorNombre || null; // Nombre de quien autorizó
    this.autorizadoPorRol = data.autorizadoPorRol || null; // Rol de quien autorizó
    this.detalles = data.detalles || {}; // Objeto con detalles adicionales de la acción
    this.ipAddress = data.ipAddress || null; // IP desde donde se realizó la acción
    this.resultado = data.resultado || 'exitoso'; // 'exitoso', 'fallido', 'pendiente'
    this.requiereAutorizacion = data.requiereAutorizacion || false; // Si la acción requiere autorización
    this.autorizado = data.autorizado !== undefined ? data.autorizado : true; // Si fue autorizado
  }

  // Tipos de acciones comunes
  static ACCIONES = {
    // Usuarios
    CREAR_USUARIO: 'crear_usuario',
    ACTUALIZAR_USUARIO: 'actualizar_usuario',
    ELIMINAR_USUARIO: 'eliminar_usuario',
    ACTIVAR_USUARIO: 'activar_usuario',
    DESACTIVAR_USUARIO: 'desactivar_usuario',
    CAMBIAR_ROL: 'cambiar_rol',
    CAMBIAR_PIN: 'cambiar_pin',
    
    // Pedidos
    CREAR_PEDIDO: 'crear_pedido',
    MODIFICAR_PEDIDO: 'modificar_pedido',
    CANCELAR_PEDIDO: 'cancelar_pedido',
    ELIMINAR_PEDIDO: 'eliminar_pedido',
    
    // Pagos
    PROCESAR_PAGO: 'procesar_pago',
    CANCELAR_PAGO: 'cancelar_pago',
    REEMBOLSO: 'reembolso',
    DIVIDIR_CUENTA: 'dividir_cuenta',
    
    // Menú
    CREAR_ITEM: 'crear_item',
    ACTUALIZAR_ITEM: 'actualizar_item',
    ELIMINAR_ITEM: 'eliminar_item',
    CAMBIAR_PRECIO: 'cambiar_precio',
    
    // Mesas
    CREAR_MESA: 'crear_mesa',
    ACTUALIZAR_MESA: 'actualizar_mesa',
    ELIMINAR_MESA: 'eliminar_mesa',
    
    // Configuración
    CAMBIAR_CONFIGURACION: 'cambiar_configuracion',
    ACTUALIZAR_IMPUESTOS: 'actualizar_impuestos',
    ACTUALIZAR_PROPINAS: 'actualizar_propinas',
    
    // Reportes
    VER_REPORTE: 'ver_reporte',
    EXPORTAR_DATOS: 'exportar_datos',
    
    // Autenticación
    LOGIN: 'login',
    LOGOUT: 'logout',
    INTENTO_ACCESO_DENEGADO: 'intento_acceso_denegado'
  };

  // Módulos del sistema
  static MODULOS = {
    USUARIOS: 'usuarios',
    PEDIDOS: 'pedidos',
    PAGOS: 'pagos',
    MENU: 'menu',
    MESAS: 'mesas',
    RESERVACIONES: 'reservaciones',
    CONFIGURACION: 'configuracion',
    REPORTES: 'reportes',
    COCINA: 'cocina',
    AUTENTICACION: 'autenticacion'
  };

  // Resultados posibles
  static RESULTADOS = {
    EXITOSO: 'exitoso',
    FALLIDO: 'fallido',
    PENDIENTE: 'pendiente'
  };

  /**
   * Valida que la acción sea válida
   * @returns {boolean}
   */
  validarAccion() {
    const accionesValidas = Object.values(Autorizacion.ACCIONES);
    return accionesValidas.includes(this.accion);
  }

  /**
   * Valida que el módulo sea válido
   * @returns {boolean}
   */
  validarModulo() {
    const modulosValidos = Object.values(Autorizacion.MODULOS);
    return modulosValidos.includes(this.modulo);
  }

  /**
   * Valida todos los campos requeridos
   * @returns {Object} { valido: boolean, errores: string[] }
   */
  validar() {
    const errores = [];

    if (!this.accion) {
      errores.push('La acción es requerida');
    }

    if (!this.modulo) {
      errores.push('El módulo es requerido');
    }

    if (!this.usuarioId) {
      errores.push('El ID del usuario es requerido');
    }

    if (!this.usuarioNombre) {
      errores.push('El nombre del usuario es requerido');
    }

    if (this.requiereAutorizacion && !this.autorizadoPorId) {
      errores.push('Se requiere ID de quien autorizó');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Obtiene el nombre legible de la acción
   * @returns {string}
   */
  obtenerNombreAccion() {
    const nombres = {
      crear_usuario: 'Crear Usuario',
      actualizar_usuario: 'Actualizar Usuario',
      eliminar_usuario: 'Eliminar Usuario',
      activar_usuario: 'Activar Usuario',
      desactivar_usuario: 'Desactivar Usuario',
      cambiar_rol: 'Cambiar Rol',
      cambiar_pin: 'Cambiar PIN',
      crear_pedido: 'Crear Pedido',
      modificar_pedido: 'Modificar Pedido',
      cancelar_pedido: 'Cancelar Pedido',
      eliminar_pedido: 'Eliminar Pedido',
      procesar_pago: 'Procesar Pago',
      cancelar_pago: 'Cancelar Pago',
      reembolso: 'Reembolso',
      dividir_cuenta: 'Dividir Cuenta',
      crear_item: 'Crear Item',
      actualizar_item: 'Actualizar Item',
      eliminar_item: 'Eliminar Item',
      cambiar_precio: 'Cambiar Precio',
      crear_mesa: 'Crear Mesa',
      actualizar_mesa: 'Actualizar Mesa',
      eliminar_mesa: 'Eliminar Mesa',
      cambiar_configuracion: 'Cambiar Configuración',
      actualizar_impuestos: 'Actualizar Impuestos',
      actualizar_propinas: 'Actualizar Propinas',
      ver_reporte: 'Ver Reporte',
      exportar_datos: 'Exportar Datos',
      login: 'Inicio de Sesión',
      logout: 'Cierre de Sesión',
      intento_acceso_denegado: 'Intento de Acceso Denegado'
    };
    return nombres[this.accion] || this.accion;
  }

  /**
   * Obtiene el nombre legible del módulo
   * @returns {string}
   */
  obtenerNombreModulo() {
    const nombres = {
      usuarios: 'Usuarios',
      pedidos: 'Pedidos',
      pagos: 'Pagos',
      menu: 'Menú',
      mesas: 'Mesas',
      reservaciones: 'Reservaciones',
      configuracion: 'Configuración',
      reportes: 'Reportes',
      cocina: 'Cocina',
      autenticacion: 'Autenticación'
    };
    return nombres[this.modulo] || this.modulo;
  }

  /**
   * Convierte la autorización a formato JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      fechaHora: this.fechaHora,
      accion: this.accion,
      nombreAccion: this.obtenerNombreAccion(),
      modulo: this.modulo,
      nombreModulo: this.obtenerNombreModulo(),
      usuario: {
        id: this.usuarioId,
        nombre: this.usuarioNombre,
        rol: this.usuarioRol
      },
      autorizadoPor: this.autorizadoPorId ? {
        id: this.autorizadoPorId,
        nombre: this.autorizadoPorNombre,
        rol: this.autorizadoPorRol
      } : null,
      detalles: this.detalles,
      ipAddress: this.ipAddress,
      resultado: this.resultado,
      requiereAutorizacion: this.requiereAutorizacion,
      autorizado: this.autorizado
    };
  }

  /**
   * Convierte la autorización a formato para Firestore
   * @returns {Object}
   */
  toFirestore() {
    // Construir objeto usuario solo con campos definidos
    const usuario = {};
    if (this.usuarioId) usuario.id = this.usuarioId;
    if (this.usuarioNombre) usuario.nombre = this.usuarioNombre;
    if (this.usuarioRol) usuario.rol = this.usuarioRol;

    // Construir objeto autorizadoPor solo si existe ID
    let autorizadoPor = null;
    if (this.autorizadoPorId) {
      autorizadoPor = { id: this.autorizadoPorId };
      if (this.autorizadoPorNombre) autorizadoPor.nombre = this.autorizadoPorNombre;
      if (this.autorizadoPorRol) autorizadoPor.rol = this.autorizadoPorRol;
    }

    const data = {
      fechaHora: this.fechaHora,
      accion: this.accion,
      modulo: this.modulo,
      usuario,
      detalles: this.detalles || {},
      resultado: this.resultado,
      requiereAutorizacion: this.requiereAutorizacion,
      autorizado: this.autorizado
    };

    // Solo agregar autorizadoPor si existe
    if (autorizadoPor) {
      data.autorizadoPor = autorizadoPor;
    }

    // Solo agregar ipAddress si existe
    if (this.ipAddress) {
      data.ipAddress = this.ipAddress;
    }

    return data;
  }

  /**
   * Crea una autorización desde un objeto de Firestore
   * @param {string} id - ID del documento
   * @param {Object} data - Datos del documento
   * @returns {Autorizacion}
   */
  static fromFirestore(id, data) {
    return new Autorizacion({
      id,
      ...data,
      usuarioId: data.usuario?.id,
      usuarioNombre: data.usuario?.nombre,
      usuarioRol: data.usuario?.rol,
      autorizadoPorId: data.autorizadoPor?.id,
      autorizadoPorNombre: data.autorizadoPor?.nombre,
      autorizadoPorRol: data.autorizadoPor?.rol
    });
  }
}

module.exports = Autorizacion;
