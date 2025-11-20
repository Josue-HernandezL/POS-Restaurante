// Modelo de Usuario para Firestore
const roles = ['admin', 'gerente', 'cajero', 'mesero', 'cocinero'];

class Usuario {
  constructor(data) {
    this.nombreCompleto = data.nombreCompleto;
    this.correoElectronico = data.correoElectronico;
    this.rol = data.rol;
    this.contrasenaHash = data.contrasenaHash;
    this.creadoEn = data.creadoEn || new Date();
    this.actualizadoEn = data.actualizadoEn || new Date();
    this.activo = data.activo !== undefined ? data.activo : true;
  }

  // Validar que el rol sea válido
  static validarRol(rol) {
    return roles.includes(rol);
  }

  // Obtener roles disponibles
  static obtenerRoles() {
    return roles;
  }

  // Convertir a objeto plano para Firestore
  toFirestore() {
    return {
      nombreCompleto: this.nombreCompleto,
      correoElectronico: this.correoElectronico,
      rol: this.rol,
      contrasenaHash: this.contrasenaHash,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      activo: this.activo,
    };
  }

  // Convertir a objeto seguro (sin contraseña)
  toJSON() {
    return {
      nombreCompleto: this.nombreCompleto,
      correoElectronico: this.correoElectronico,
      rol: this.rol,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      activo: this.activo,
    };
  }
}

module.exports = Usuario;
