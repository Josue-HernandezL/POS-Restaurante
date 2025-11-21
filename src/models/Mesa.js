/**
 * Modelo de Mesa
 * Representa una mesa del restaurante con su capacidad, sección y estado
 */

class Mesa {
  constructor(data = {}) {
    this.numeroMesa = data.numeroMesa || '';
    this.capacidad = data.capacidad || 4;
    this.seccion = data.seccion || '';
    this.estado = data.estado || 'libre';
    this.creadoEn = data.creadoEn || new Date().toISOString();
    this.actualizadoEn = data.actualizadoEn || new Date().toISOString();
    this.activo = data.activo !== undefined ? data.activo : true;
  }

  /**
   * Estados válidos para una mesa
   */
  static get ESTADOS() {
    return ['libre', 'ocupada', 'reservada', 'en_limpieza'];
  }

  /**
   * Valida el número de mesa
   */
  validarNumeroMesa() {
    const errores = [];

    if (!this.numeroMesa || this.numeroMesa.trim() === '') {
      errores.push('El número de mesa es requerido');
    }

    if (this.numeroMesa && this.numeroMesa.length < 1) {
      errores.push('El número de mesa debe tener al menos 1 carácter');
    }

    if (this.numeroMesa && this.numeroMesa.length > 50) {
      errores.push('El número de mesa no puede exceder 50 caracteres');
    }

    return errores;
  }

  /**
   * Valida la capacidad de la mesa
   */
  validarCapacidad() {
    const errores = [];

    if (this.capacidad === undefined || this.capacidad === null) {
      errores.push('La capacidad es requerida');
    }

    if (typeof this.capacidad !== 'number') {
      errores.push('La capacidad debe ser un número');
    }

    if (this.capacidad < 1 || this.capacidad > 20) {
      errores.push('La capacidad debe estar entre 1 y 20 personas');
    }

    return errores;
  }

  /**
   * Valida la sección
   */
  validarSeccion() {
    const errores = [];

    if (!this.seccion || this.seccion.trim() === '') {
      errores.push('La sección es requerida');
    }

    if (this.seccion && this.seccion.length < 3) {
      errores.push('La sección debe tener al menos 3 caracteres');
    }

    if (this.seccion && this.seccion.length > 100) {
      errores.push('La sección no puede exceder 100 caracteres');
    }

    return errores;
  }

  /**
   * Valida el estado de la mesa
   */
  validarEstado() {
    const errores = [];

    if (!this.estado) {
      errores.push('El estado es requerido');
    }

    if (!Mesa.ESTADOS.includes(this.estado)) {
      errores.push(`El estado debe ser uno de: ${Mesa.ESTADOS.join(', ')}`);
    }

    return errores;
  }

  /**
   * Valida todos los campos de la mesa
   */
  validar() {
    return [
      ...this.validarNumeroMesa(),
      ...this.validarCapacidad(),
      ...this.validarSeccion(),
      ...this.validarEstado()
    ];
  }

  /**
   * Convierte el modelo a un objeto para Firestore
   */
  toFirestore() {
    return {
      numeroMesa: this.numeroMesa.trim(),
      capacidad: this.capacidad,
      seccion: this.seccion.trim(),
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: new Date().toISOString(),
      activo: this.activo
    };
  }

  /**
   * Convierte el modelo a JSON para respuestas de API
   */
  toJSON() {
    return {
      id: this.id,
      numeroMesa: this.numeroMesa,
      capacidad: this.capacidad,
      seccion: this.seccion,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      activo: this.activo
    };
  }

  /**
   * Crea una instancia desde datos de Firestore
   */
  static fromFirestore(id, data) {
    const mesa = new Mesa(data);
    mesa.id = id;
    return mesa;
  }
}

module.exports = Mesa;
