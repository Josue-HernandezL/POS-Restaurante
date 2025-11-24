const { db } = require('../config/firebase');
const ItemMenu = require('../models/ItemMenu');

// Colecciones en Firestore
const itemsCollection = db.collection('items');
const categoriasCollection = db.collection('categorias');

/**
 * Crear un nuevo ítem del menú
 */
const crearItem = async (req, res) => {
  try {
    const { nombre, categoriaId, precio, disponibilidad, descripcion } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!nombre || !categoriaId || precio === undefined || !descripcion) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Nombre, categoría, precio y descripción son requeridos',
      });
    }

    // Validar precio
    if (!ItemMenu.validarPrecio(precio)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El precio debe ser un número mayor o igual a 0',
      });
    }

    // Verificar que la categoría existe y está activa
    const categoriaDoc = await categoriasCollection.doc(categoriaId).get();

    if (!categoriaDoc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'La categoría especificada no existe',
      });
    }

    if (!categoriaDoc.data().activo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La categoría especificada está inactiva',
      });
    }

    // Validar longitud del nombre
    if (nombre.trim().length < 3) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El nombre debe tener al menos 3 caracteres',
      });
    }

    // Verificar si ya existe un ítem con ese nombre en la misma categoría
    const itemExistente = await itemsCollection
      .where('nombre', '==', nombre.trim())
      .where('categoriaId', '==', categoriaId)
      .where('activo', '==', true)
      .get();

    if (!itemExistente.empty) {
      return res.status(409).json({
        exito: false,
        mensaje: 'Ya existe un ítem con ese nombre en esta categoría',
      });
    }

    // Crear nuevo ítem
    const nuevoItem = new ItemMenu({
      nombre: nombre.trim(),
      categoriaId,
      precio: parseFloat(precio),
      disponibilidad: disponibilidad !== undefined ? disponibilidad : true,
      descripcion: descripcion.trim(),
    });

    // Guardar en Firestore
    const docRef = await itemsCollection.add(nuevoItem.toFirestore());

    return res.status(201).json({
      exito: true,
      mensaje: 'Ítem creado exitosamente',
      datos: {
        id: docRef.id,
        ...nuevoItem.toJSON(),
        categoria: {
          id: categoriaDoc.id,
          nombre: categoriaDoc.data().nombre,
        },
      },
    });
  } catch (error) {
    console.error('Error al crear ítem:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al crear ítem',
      error: error.message,
    });
  }
};

/**
 * Obtener todos los ítems del menú
 */
const obtenerItems = async (req, res) => {
  try {
    const { categoriaId, disponibilidad, activo } = req.query;

    let query = itemsCollection;

    // Filtrar por categoría si se especifica
    if (categoriaId) {
      query = query.where('categoriaId', '==', categoriaId);
    }

    // Filtrar por disponibilidad si se especifica
    if (disponibilidad !== undefined) {
      query = query.where('disponibilidad', '==', disponibilidad === 'true');
    }

    // Filtrar por estado activo si se especifica
    if (activo !== undefined) {
      query = query.where('activo', '==', activo === 'true');
    }

    const snapshot = await query.orderBy('nombre', 'asc').get();

    const items = [];
    
    // Obtener información de las categorías
    for (const doc of snapshot.docs) {
      const itemData = doc.data();
      const categoriaDoc = await categoriasCollection.doc(itemData.categoriaId).get();
      
      items.push({
        id: doc.id,
        ...itemData,
        categoria: categoriaDoc.exists ? {
          id: categoriaDoc.id,
          nombre: categoriaDoc.data().nombre,
        } : null,
      });
    }

    return res.status(200).json({
      exito: true,
      datos: items,
      total: items.length,
    });
  } catch (error) {
    console.error('Error al obtener ítems:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener ítems',
      error: error.message,
    });
  }
};

/**
 * Obtener un ítem por ID
 */
const obtenerItemPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await itemsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Ítem no encontrado',
      });
    }

    const itemData = doc.data();
    const categoriaDoc = await categoriasCollection.doc(itemData.categoriaId).get();

    return res.status(200).json({
      exito: true,
      datos: {
        id: doc.id,
        ...itemData,
        categoria: categoriaDoc.exists ? {
          id: categoriaDoc.id,
          nombre: categoriaDoc.data().nombre,
          descripcion: categoriaDoc.data().descripcion,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error al obtener ítem:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener ítem',
      error: error.message,
    });
  }
};

/**
 * Actualizar un ítem
 */
const actualizarItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoriaId, precio, disponibilidad, descripcion, activo } = req.body;

    // Verificar que el ítem existe
    const doc = await itemsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Ítem no encontrado',
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
      datosActualizados.nombre = nombre.trim();
    }

    if (categoriaId !== undefined) {
      // Verificar que la categoría existe y está activa
      const categoriaDoc = await categoriasCollection.doc(categoriaId).get();

      if (!categoriaDoc.exists) {
        return res.status(404).json({
          exito: false,
          mensaje: 'La categoría especificada no existe',
        });
      }

      if (!categoriaDoc.data().activo) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La categoría especificada está inactiva',
        });
      }

      datosActualizados.categoriaId = categoriaId;
    }

    if (precio !== undefined) {
      if (!ItemMenu.validarPrecio(precio)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El precio debe ser un número mayor o igual a 0',
        });
      }
      datosActualizados.precio = parseFloat(precio);
    }

    if (disponibilidad !== undefined) {
      datosActualizados.disponibilidad = disponibilidad;
    }

    if (descripcion !== undefined) {
      datosActualizados.descripcion = descripcion.trim();
    }

    if (activo !== undefined) {
      datosActualizados.activo = activo;
    }

    // Actualizar en Firestore
    await itemsCollection.doc(id).update(datosActualizados);

    // Obtener datos actualizados
    const docActualizado = await itemsCollection.doc(id).get();
    const itemData = docActualizado.data();
    const categoriaDoc = await categoriasCollection.doc(itemData.categoriaId).get();

    return res.status(200).json({
      exito: true,
      mensaje: 'Ítem actualizado exitosamente',
      datos: {
        id: docActualizado.id,
        ...itemData,
        categoria: categoriaDoc.exists ? {
          id: categoriaDoc.id,
          nombre: categoriaDoc.data().nombre,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error al actualizar ítem:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar ítem',
      error: error.message,
    });
  }
};

/**
 * Eliminar un ítem (eliminación física)
 */
const eliminarItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el ítem existe
    const doc = await itemsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Ítem no encontrado',
      });
    }

    // Eliminación física: eliminar el documento de la base de datos
    await itemsCollection.doc(id).delete();

    return res.status(200).json({
      exito: true,
      mensaje: 'Ítem eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar ítem:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar ítem',
      error: error.message,
    });
  }
};

module.exports = {
  crearItem,
  obtenerItems,
  obtenerItemPorId,
  actualizarItem,
  eliminarItem,
};
