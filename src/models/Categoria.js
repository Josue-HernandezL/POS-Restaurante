// Modelo de Categoría para Firestore
class Categoria {
  constructor(data) {
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.creadoEn = data.creadoEn || new Date();
    this.actualizadoEn = data.actualizadoEn || new Date();
    this.activo = data.activo !== undefined ? data.activo : true;
  }

  // Convertir a objeto plano para Firestore
  toFirestore() {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      activo: this.activo,
    };
  }

  // Convertir a objeto JSON
  toJSON() {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      activo: this.activo,
    };
  }
}

module.exports = Categoria;
