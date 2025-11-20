// Modelo de Item del Menú para Firestore
class ItemMenu {
  constructor(data) {
    this.nombre = data.nombre;
    this.categoriaId = data.categoriaId; // ID de la categoría a la que pertenece
    this.precio = data.precio;
    this.disponibilidad = data.disponibilidad !== undefined ? data.disponibilidad : true;
    this.descripcion = data.descripcion;
    this.creadoEn = data.creadoEn || new Date();
    this.actualizadoEn = data.actualizadoEn || new Date();
    this.activo = data.activo !== undefined ? data.activo : true;
  }

  // Validar que el precio sea válido
  static validarPrecio(precio) {
    return typeof precio === 'number' && precio >= 0;
  }

  // Convertir a objeto plano para Firestore
  toFirestore() {
    return {
      nombre: this.nombre,
      categoriaId: this.categoriaId,
      precio: this.precio,
      disponibilidad: this.disponibilidad,
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
      categoriaId: this.categoriaId,
      precio: this.precio,
      disponibilidad: this.disponibilidad,
      descripcion: this.descripcion,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      activo: this.activo,
    };
  }
}

module.exports = ItemMenu;
