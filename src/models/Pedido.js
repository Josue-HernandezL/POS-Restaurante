class Pedido {
  static ESTADOS = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'];

  constructor(data = {}) {
    this.mesaId = data.mesaId || null;
    this.numeroMesa = data.numeroMesa || '';
    this.items = data.items || []; // Array de items del pedido
    this.observaciones = data.observaciones || '';
    this.subtotal = data.subtotal || 0;
    this.impuestos = data.impuestos || 0;
    this.total = data.total || 0;
    this.estado = data.estado || 'pendiente';
    this.meseroId = data.meseroId || null;
    this.meseroNombre = data.meseroNombre || '';
    this.creadoEn = data.creadoEn || new Date().toISOString();
    this.actualizadoEn = data.actualizadoEn || new Date().toISOString();
    this.activo = data.activo !== undefined ? data.activo : true;
  }

  /**
   * Valida los datos del pedido
   */
  validar() {
    const errores = [];

    // Validar mesa
    if (!this.mesaId || this.mesaId.trim() === '') {
      errores.push('El ID de la mesa es requerido');
    }

    if (!this.numeroMesa || this.numeroMesa.trim() === '') {
      errores.push('El número de mesa es requerido');
    }

    // Validar items
    if (!Array.isArray(this.items) || this.items.length === 0) {
      errores.push('El pedido debe tener al menos un item');
    }

    // Validar cada item
    if (Array.isArray(this.items)) {
      this.items.forEach((item, index) => {
        if (!item.itemId || item.itemId.trim() === '') {
          errores.push(`Item ${index + 1}: ID del item es requerido`);
        }
        if (!item.nombre || item.nombre.trim() === '') {
          errores.push(`Item ${index + 1}: Nombre del item es requerido`);
        }
        if (typeof item.cantidad !== 'number' || item.cantidad < 1) {
          errores.push(`Item ${index + 1}: La cantidad debe ser al menos 1`);
        }
        if (typeof item.precioUnitario !== 'number' || item.precioUnitario < 0) {
          errores.push(`Item ${index + 1}: El precio unitario debe ser un número válido`);
        }
      });
    }

    // Validar estado
    if (!Pedido.ESTADOS.includes(this.estado)) {
      errores.push(`Estado inválido. Debe ser uno de: ${Pedido.ESTADOS.join(', ')}`);
    }

    // Validar observaciones (máximo 500 caracteres)
    if (this.observaciones && this.observaciones.length > 500) {
      errores.push('Las observaciones no pueden exceder 500 caracteres');
    }

    // Validar totales
    if (typeof this.subtotal !== 'number' || this.subtotal < 0) {
      errores.push('El subtotal debe ser un número válido');
    }
    if (typeof this.impuestos !== 'number' || this.impuestos < 0) {
      errores.push('Los impuestos deben ser un número válido');
    }
    if (typeof this.total !== 'number' || this.total < 0) {
      errores.push('El total debe ser un número válido');
    }

    return errores;
  }

  /**
   * Calcula los totales del pedido
   */
  calcularTotales(porcentajeImpuesto = 16) {
    // Calcular subtotal
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + (item.precioUnitario * item.cantidad);
    }, 0);

    // Calcular impuestos
    this.impuestos = (this.subtotal * porcentajeImpuesto) / 100;

    // Calcular total
    this.total = this.subtotal + this.impuestos;

    // Redondear a 2 decimales
    this.subtotal = Math.round(this.subtotal * 100) / 100;
    this.impuestos = Math.round(this.impuestos * 100) / 100;
    this.total = Math.round(this.total * 100) / 100;
  }

  /**
   * Valida el estado del pedido
   */
  validarEstado(nuevoEstado) {
    if (!Pedido.ESTADOS.includes(nuevoEstado)) {
      return {
        valido: false,
        mensaje: `Estado inválido. Debe ser uno de: ${Pedido.ESTADOS.join(', ')}`
      };
    }

    // Validar transiciones de estado
    const transicionesValidas = {
      'pendiente': ['en_preparacion', 'cancelado'],
      'en_preparacion': ['listo', 'cancelado'],
      'listo': ['entregado', 'cancelado'],
      'entregado': [],
      'cancelado': []
    };

    const estadosPermitidos = transicionesValidas[this.estado] || [];
    
    if (!estadosPermitidos.includes(nuevoEstado)) {
      return {
        valido: false,
        mensaje: `No se puede cambiar de '${this.estado}' a '${nuevoEstado}'`
      };
    }

    return { valido: true };
  }

  /**
   * Convierte el pedido a formato Firestore
   */
  toFirestore() {
    return {
      mesaId: this.mesaId,
      numeroMesa: this.numeroMesa,
      items: this.items,
      observaciones: this.observaciones,
      subtotal: this.subtotal,
      impuestos: this.impuestos,
      total: this.total,
      estado: this.estado,
      meseroId: this.meseroId,
      meseroNombre: this.meseroNombre,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      activo: this.activo
    };
  }

  /**
   * Convierte el pedido a formato JSON
   */
  toJSON() {
    return {
      id: this.id,
      mesaId: this.mesaId,
      numeroMesa: this.numeroMesa,
      items: this.items,
      observaciones: this.observaciones,
      subtotal: this.subtotal,
      impuestos: this.impuestos,
      total: this.total,
      estado: this.estado,
      meseroId: this.meseroId,
      meseroNombre: this.meseroNombre,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      activo: this.activo
    };
  }

  /**
   * Crea una instancia de Pedido desde datos de Firestore
   */
  static fromFirestore(id, data) {
    const pedido = new Pedido(data);
    pedido.id = id;
    return pedido;
  }
}

module.exports = Pedido;
