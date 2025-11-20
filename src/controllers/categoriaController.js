const { db } = require('../config/firebase');
const Categoria = require('../models/Categoria');

// Colección de categorías en Firestore
const categoriasCollection = db.collection('categorias');

/**
 * Crear una nueva categoría
 */
const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !descripcion) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El nombre y la descripción son requeridos',
      });
    }

    // Validar longitud del nombre
    if (nombre.trim().length < 3) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El nombre debe tener al menos 3 caracteres',
      });
    }

    // Verificar si ya existe una categoría con ese nombre
    const categoriaExistente = await categoriasCollection
      .where('nombre', '==', nombre.trim())
      .where('activo', '==', true)
      .get();

    if (!categoriaExistente.empty) {
      return res.status(409).json({
        exito: false,
        mensaje: 'Ya existe una categoría con ese nombre',
      });
    }

    // Crear nueva categoría
    const nuevaCategoria = new Categoria({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
    });

    // Guardar en Firestore
    const docRef = await categoriasCollection.add(nuevaCategoria.toFirestore());

    return res.status(201).json({
      exito: true,
      mensaje: 'Categoría creada exitosamente',
      datos: {
        id: docRef.id,
        ...nuevaCategoria.toJSON(),
      },
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al crear categoría',
      error: error.message,
    });
  }
};

/**
 * Obtener todas las categorías
 */
const obtenerCategorias = async (req, res) => {
  try {
    const { activo } = req.query;

    let query = categoriasCollection;

    // Filtrar por estado activo si se especifica
    if (activo !== undefined) {
      query = query.where('activo', '==', activo === 'true');
    }

    const snapshot = await query.orderBy('nombre', 'asc').get();

    const categorias = [];
    snapshot.forEach((doc) => {
      categorias.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      exito: true,
      datos: categorias,
      total: categorias.length,
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener categorías',
      error: error.message,
    });
  }
};

/**
 * Obtener una categoría por ID
 */
const obtenerCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await categoriasCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Categoría no encontrada',
      });
    }

    return res.status(200).json({
      exito: true,
      datos: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener categoría',
      error: error.message,
    });
  }
};

/**
 * Actualizar una categoría
 */
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    // Verificar que la categoría existe
    const doc = await categoriasCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Categoría no encontrada',
      });
    }

    // Preparar datos para actualizar
    const datosActualizados = {
      actualizadoEn: new Date(),
    };

    if (nombre !== undefined) {
      if (nombre.trim().length < 3) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El nombre debe tener al menos 3 caracteres',
        });
      }

      // Verificar que no exista otra categoría con ese nombre
      const categoriaExistente = await categoriasCollection
        .where('nombre', '==', nombre.trim())
        .where('activo', '==', true)
        .get();

      if (!categoriaExistente.empty && categoriaExistente.docs[0].id !== id) {
        return res.status(409).json({
          exito: false,
          mensaje: 'Ya existe una categoría con ese nombre',
        });
      }

      datosActualizados.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      datosActualizados.descripcion = descripcion.trim();
    }

    if (activo !== undefined) {
      datosActualizados.activo = activo;
    }

    // Actualizar en Firestore
    await categoriasCollection.doc(id).update(datosActualizados);

    // Obtener datos actualizados
    const docActualizado = await categoriasCollection.doc(id).get();

    return res.status(200).json({
      exito: true,
      mensaje: 'Categoría actualizada exitosamente',
      datos: {
        id: docActualizado.id,
        ...docActualizado.data(),
      },
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar categoría',
      error: error.message,
    });
  }
};

/**
 * Eliminar una categoría (soft delete)
 */
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la categoría existe
    const doc = await categoriasCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Categoría no encontrada',
      });
    }

    // Verificar si hay ítems asociados a esta categoría
    const itemsCollection = db.collection('items');
    const itemsAsociados = await itemsCollection
      .where('categoriaId', '==', id)
      .where('activo', '==', true)
      .get();

    if (!itemsAsociados.empty) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se puede eliminar la categoría porque tiene ítems asociados',
        itemsAsociados: itemsAsociados.size,
      });
    }

    // Soft delete: marcar como inactivo
    await categoriasCollection.doc(id).update({
      activo: false,
      actualizadoEn: new Date(),
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Categoría eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar categoría',
      error: error.message,
    });
  }
};

module.exports = {
  crearCategoria,
  obtenerCategorias,
  obtenerCategoriaPorId,
  actualizarCategoria,
  eliminarCategoria,
};
