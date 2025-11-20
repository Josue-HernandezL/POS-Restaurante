// Modelo de Reservación para Firestore
const estados = ['pendiente', 'confirmada', 'sentada', 'terminada', 'cancelada'];

class Reservacion {
  constructor(data) {
    this.nombreCliente = data.nombreCliente;
    this.telefono = data.telefono;
    this.fecha = data.fecha;
    this.hora = data.hora;
    this.numeroPersonas = data.numeroPersonas;
    this.mesaAsignada = data.mesaAsignada;
    this.notas = data.notas || '';
    this.estado = data.estado || 'pendiente';
    this.creadoEn = data.creadoEn || new Date();
    this.actualizadoEn = data.actualizadoEn || new Date();
    this.creadoPor = data.creadoPor; // UID del usuario que creó la reservación
  }

  // Validar que el estado sea válido
  static validarEstado(estado) {
    return estados.includes(estado);
  }

  // Obtener estados disponibles
  static obtenerEstados() {
    return estados;
  }

  // Validar número de personas
  static validarNumeroPersonas(numero) {
    return typeof numero === 'number' && numero > 0 && numero <= 20;
  }

  // Convertir a objeto plano para Firestore
  toFirestore() {
    return {
      nombreCliente: this.nombreCliente,
      telefono: this.telefono,
      fecha: this.fecha,
      hora: this.hora,
      numeroPersonas: this.numeroPersonas,
      mesaAsignada: this.mesaAsignada,
      notas: this.notas,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      creadoPor: this.creadoPor,
    };
  }

  // Convertir a objeto JSON
  toJSON() {
    return {
      nombreCliente: this.nombreCliente,
      telefono: this.telefono,
      fecha: this.fecha,
      hora: this.hora,
      numeroPersonas: this.numeroPersonas,
      mesaAsignada: this.mesaAsignada,
      notas: this.notas,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      creadoPor: this.creadoPor,
    };
  }
}

module.exports = Reservacion;
