/**
 * Modelo de Configuración del Restaurante
 * Maneja la información del restaurante, notificaciones, impuestos y propinas
 */

class Configuracion {
  constructor(data = {}) {
    // Información del Restaurante
    this.restaurante = {
      nombre: data.restaurante?.nombre || '',
      direccion: data.restaurante?.direccion || '',
      telefono: data.restaurante?.telefono || '',
      numeroMesas: data.restaurante?.numeroMesas || 0
    };

    // Configuración de Notificaciones
    this.notificaciones = {
      nuevasOrdenes: data.notificaciones?.nuevasOrdenes !== undefined 
        ? data.notificaciones.nuevasOrdenes 
        : true,
      nuevasReservaciones: data.notificaciones?.nuevasReservaciones !== undefined 
        ? data.notificaciones.nuevasReservaciones 
        : true
    };

    // Configuración de Impuestos
    this.impuestos = {
      porcentajeIVA: data.impuestos?.porcentajeIVA || 0,
      aplicarATodos: data.impuestos?.aplicarATodos !== undefined 
        ? data.impuestos.aplicarATodos 
        : true
    };

    // Opciones de Propina
    this.propinas = {
      opcion1: data.propinas?.opcion1 || 10,
      opcion2: data.propinas?.opcion2 || 15,
      opcion3: data.propinas?.opcion3 || 20,
      permitirPersonalizada: data.propinas?.permitirPersonalizada !== undefined 
        ? data.propinas.permitirPersonalizada 
        : true
    };

    // Metadatos
    this.creadoEn = data.creadoEn || new Date().toISOString();
    this.actualizadoEn = data.actualizadoEn || new Date().toISOString();
  }

  /**
   * Valida la información del restaurante
   */
  validarRestaurante() {
    const errores = [];

    if (this.restaurante.nombre && this.restaurante.nombre.length < 3) {
      errores.push('El nombre del restaurante debe tener al menos 3 caracteres');
    }

    if (this.restaurante.nombre && this.restaurante.nombre.length > 100) {
      errores.push('El nombre del restaurante no puede exceder 100 caracteres');
    }

    if (this.restaurante.direccion && this.restaurante.direccion.length < 10) {
      errores.push('La dirección debe tener al menos 10 caracteres');
    }

    if (this.restaurante.direccion && this.restaurante.direccion.length > 200) {
      errores.push('La dirección no puede exceder 200 caracteres');
    }

    if (this.restaurante.telefono && this.restaurante.telefono.replace(/\D/g, '').length < 10) {
      errores.push('El teléfono debe tener al menos 10 dígitos');
    }

    if (this.restaurante.numeroMesas !== undefined && 
        (this.restaurante.numeroMesas < 0 || this.restaurante.numeroMesas > 500)) {
      errores.push('El número de mesas debe estar entre 0 y 500');
    }

    return errores;
  }

  /**
   * Valida la configuración de impuestos
   */
  validarImpuestos() {
    const errores = [];

    if (this.impuestos.porcentajeIVA < 0 || this.impuestos.porcentajeIVA > 100) {
      errores.push('El porcentaje de IVA debe estar entre 0 y 100');
    }

    if (typeof this.impuestos.aplicarATodos !== 'boolean') {
      errores.push('El campo aplicarATodos debe ser un valor booleano');
    }

    return errores;
  }

  /**
   * Valida las opciones de propina
   */
  validarPropinas() {
    const errores = [];

    if (this.propinas.opcion1 < 0 || this.propinas.opcion1 > 100) {
      errores.push('La opción de propina 1 debe estar entre 0 y 100');
    }

    if (this.propinas.opcion2 < 0 || this.propinas.opcion2 > 100) {
      errores.push('La opción de propina 2 debe estar entre 0 y 100');
    }

    if (this.propinas.opcion3 < 0 || this.propinas.opcion3 > 100) {
      errores.push('La opción de propina 3 debe estar entre 0 y 100');
    }

    if (typeof this.propinas.permitirPersonalizada !== 'boolean') {
      errores.push('El campo permitirPersonalizada debe ser un valor booleano');
    }

    return errores;
  }

  /**
   * Valida la configuración de notificaciones
   */
  validarNotificaciones() {
    const errores = [];

    if (typeof this.notificaciones.nuevasOrdenes !== 'boolean') {
      errores.push('El campo nuevasOrdenes debe ser un valor booleano');
    }

    if (typeof this.notificaciones.nuevasReservaciones !== 'boolean') {
      errores.push('El campo nuevasReservaciones debe ser un valor booleano');
    }

    return errores;
  }

  /**
   * Convierte el modelo a un objeto para Firestore
   */
  toFirestore() {
    return {
      restaurante: this.restaurante,
      notificaciones: this.notificaciones,
      impuestos: this.impuestos,
      propinas: this.propinas,
      actualizadoEn: new Date().toISOString()
    };
  }

  /**
   * Convierte el modelo a JSON para respuestas de API
   */
  toJSON() {
    return {
      restaurante: this.restaurante,
      notificaciones: this.notificaciones,
      impuestos: this.impuestos,
      propinas: this.propinas,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn
    };
  }

  /**
   * Crea una instancia desde datos de Firestore
   */
  static fromFirestore(data) {
    return new Configuracion(data);
  }
}

module.exports = Configuracion;
