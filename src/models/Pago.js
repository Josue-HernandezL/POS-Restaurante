class Pago {
  constructor(data = {}) {
    this.id = data.id || null;
    this.mesaId = data.mesaId || '';
    this.numeroMesa = data.numeroMesa || '';
    this.pedidoIds = data.pedidoIds || []; // Array de IDs de pedidos pagados
    this.metodoPago = data.metodoPago || 'efectivo'; // efectivo, transferencia, tarjeta
    this.subtotal = data.subtotal || 0;
    this.impuestos = data.impuestos || 0;
    this.propina = data.propina || 0;
    this.propinaPersonalizada = data.propinaPersonalizada || false;
    this.porcentajePropina = data.porcentajePropina || 0;
    this.total = data.total || 0;
    this.cuentaDividida = data.cuentaDividida || false;
    this.numeroDivisiones = data.numeroDivisiones || 1;
    this.divisiones = data.divisiones || []; // Array de divisiones si la cuenta está dividida
    this.estado = data.estado || 'pendiente'; // pendiente, pagado, cancelado
    this.pagoCompletado = data.pagoCompletado || false;
    this.cajeroId = data.cajeroId || '';
    this.cajeroNombre = data.cajeroNombre || '';
    this.creadoEn = data.creadoEn || new Date().toISOString();
    this.actualizadoEn = data.actualizadoEn || new Date().toISOString();
  }

  /**
   * Estados válidos de pago
   */
  static ESTADOS = ['pendiente', 'pagado', 'cancelado'];

  /**
   * Métodos de pago válidos
   */
  static METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];

  /**
   * Valida que el estado sea válido
   */
  static validarEstado(estado) {
    return this.ESTADOS.includes(estado);
  }

  /**
   * Valida que el método de pago sea válido
   */
  static validarMetodoPago(metodo) {
    return this.METODOS_PAGO.includes(metodo);
  }

  /**
   * Obtiene los estados disponibles
   */
  static obtenerEstados() {
    return [...this.ESTADOS];
  }

  /**
   * Obtiene los métodos de pago disponibles
   */
  static obtenerMetodosPago() {
    return [...this.METODOS_PAGO];
  }

  /**
   * Convierte el pago a formato JSON para respuestas
   */
  toJSON() {
    return {
      id: this.id,
      mesaId: this.mesaId,
      numeroMesa: this.numeroMesa,
      pedidoIds: this.pedidoIds,
      metodoPago: this.metodoPago,
      subtotal: this.subtotal,
      impuestos: this.impuestos,
      propina: this.propina,
      propinaPersonalizada: this.propinaPersonalizada,
      porcentajePropina: this.porcentajePropina,
      total: this.total,
      cuentaDividida: this.cuentaDividida,
      numeroDivisiones: this.numeroDivisiones,
      divisiones: this.divisiones,
      estado: this.estado,
      pagoCompletado: this.pagoCompletado,
      cajeroId: this.cajeroId,
      cajeroNombre: this.cajeroNombre,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn
    };
  }

  /**
   * Crea una instancia de Pago desde datos de Firestore
   */
  static fromFirestore(id, data) {
    const pago = new Pago(data);
    pago.id = id;
    return pago;
  }
}

module.exports = Pago;
