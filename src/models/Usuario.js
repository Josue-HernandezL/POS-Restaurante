// Modelo de Usuario para Firestore
const bcrypt = require('bcryptjs');

class Usuario {
  constructor(data) {
    this.id = data.id || null;
    this.nombreCompleto = data.nombreCompleto || data.nombre;
    this.nombre = this.nombreCompleto; // Alias para compatibilidad
    this.correoElectronico = data.correoElectronico || data.correo;
    this.correo = this.correoElectronico; // Alias para compatibilidad
    this.rol = data.rol; // 'dueno', 'gerente', 'cajero', 'mesero', 'cocinero'
    this.contrasenaHash = data.contrasenaHash;
    this.pinSeguridad = data.pinSeguridad;
    this.activo = data.activo !== undefined ? data.activo : true;
    this.creadoEn = data.creadoEn || new Date().toISOString();
    this.actualizadoEn = data.actualizadoEn || new Date().toISOString();
  }

  // Roles disponibles en el sistema
  static ROLES = {
    DUENO: 'dueno',
    GERENTE: 'gerente',
    CAJERO: 'cajero',
    MESERO: 'mesero',
    COCINERO: 'cocinero'
  };

  // Estados de usuario
  static ESTADOS = {
    ACTIVO: true,
    INACTIVO: false
  };

  /**
   * Valida que el rol sea uno de los roles permitidos
   * @returns {boolean}
   */
  validarRol() {
    const rolesValidos = Object.values(Usuario.ROLES);
    return rolesValidos.includes(this.rol);
  }

  /**
   * Valida que el PIN tenga formato correcto (4-6 dígitos)
   * @param {string} pin - PIN sin hashear
   * @returns {boolean}
   */
  static validarFormatoPin(pin) {
    const pinStr = String(pin);
    return /^\d{4,6}$/.test(pinStr);
  }

  /**
   * Hashea el PIN de seguridad
   * @param {string} pin - PIN sin hashear
   * @returns {Promise<string>}
   */
  static async hashearPin(pin) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(String(pin), salt);
  }

  /**
   * Compara un PIN con el hash almacenado
   * @param {string} pin - PIN sin hashear
   * @param {string} hash - Hash almacenado
   * @returns {Promise<boolean>}
   */
  static async compararPin(pin, hash) {
    return await bcrypt.compare(String(pin), hash);
  }

  /**
   * Valida que el correo tenga formato válido
   * @returns {boolean}
   */
  validarCorreo() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.correoElectronico || this.correo);
  }

  /**
   * Valida todos los campos del usuario
   * @returns {Object} { valido: boolean, errores: string[] }
   */
  validar() {
    const errores = [];

    if (!this.nombreCompleto || this.nombreCompleto.trim().length === 0) {
      errores.push('El nombre es requerido');
    }

    if (!this.correoElectronico || !this.validarCorreo()) {
      errores.push('El correo es inválido');
    }

    if (!this.rol || !this.validarRol()) {
      errores.push('El rol es inválido');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Obtiene el nombre del rol en formato legible
   * @returns {string}
   */
  obtenerNombreRol() {
    const nombres = {
      dueno: 'Dueño',
      gerente: 'Gerente',
      cajero: 'Cajero',
      mesero: 'Mesero',
      cocinero: 'Cocinero'
    };
    return nombres[this.rol] || this.rol;
  }

  /**
   * Obtener roles disponibles
   * @returns {Array}
   */
  static obtenerRoles() {
    return Object.values(Usuario.ROLES);
  }

  /**
   * Valida que el rol sea válido (método estático para compatibilidad)
   * @param {string} rol
   * @returns {boolean}
   */
  static validarRol(rol) {
    return Object.values(Usuario.ROLES).includes(rol);
  }

  /**
   * Convierte el usuario a formato JSON (sin PIN)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nombreCompleto: this.nombreCompleto,
      correoElectronico: this.correoElectronico,
      rol: this.rol,
      nombreRol: this.obtenerNombreRol(),
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn
    };
  }

  /**
   * Convierte el usuario a formato JSON incluyendo PIN (para almacenamiento en Firestore)
   * @returns {Object}
   */
  toFirestore() {
    const data = this.toJSON();
    delete data.id; // Firestore maneja el ID por separado
    return {
      ...data,
      contrasenaHash: this.contrasenaHash,
      pinSeguridad: this.pinSeguridad
    };
  }
}

module.exports = Usuario;
