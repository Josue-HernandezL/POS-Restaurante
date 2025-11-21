const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const Mesa = require('../models/Mesa');

/**
 * Crear una nueva mesa
 */
const crearMesa = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para crear mesas'
      });
    }

    const { numeroMesa, capacidad, seccion, estado } = req.body;

    // Verificar si ya existe una mesa con ese número
    const mesasSnapshot = await db.collection('mesas')
      .where('numeroMesa', '==', numeroMesa.trim())
      .where('activo', '==', true)
      .get();

    if (!mesasSnapshot.empty) {
      return res.status(409).json({
        exito: false,
        mensaje: 'Ya existe una mesa con ese número'
      });
    }

    // Crear nueva mesa
    const nuevaMesa = new Mesa({
      numeroMesa,
      capacidad,
      seccion,
      estado: estado || 'libre'
    });

    // Validar los datos
    const erroresValidacion = nuevaMesa.validar();
    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: erroresValidacion
      });
    }

    // Guardar en Firestore
    const docRef = await db.collection('mesas').add(nuevaMesa.toFirestore());
    const mesaCreada = Mesa.fromFirestore(docRef.id, nuevaMesa.toFirestore());

    res.status(201).json({
      exito: true,
      mensaje: 'Mesa creada exitosamente',
      datos: mesaCreada.toJSON()
    });
  } catch (error) {
    console.error('Error al crear mesa:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear la mesa',
      error: error.message
    });
  }
};

/**
 * Obtener todas las mesas con filtros opcionales
 */
const obtenerMesas = async (req, res) => {
  try {
    const { estado, activo } = req.query;
    let query = db.collection('mesas');

    // Filtrar por estado si se proporciona
    if (estado) {
      if (!Mesa.ESTADOS.includes(estado)) {
        return res.status(400).json({
          exito: false,
          mensaje: `Estado inválido. Debe ser uno de: ${Mesa.ESTADOS.join(', ')}`
        });
      }
      query = query.where('estado', '==', estado);
    }

    // Filtrar por activo si se proporciona
    if (activo !== undefined) {
      const activoBoolean = activo === 'true';
      query = query.where('activo', '==', activoBoolean);
    } else {
      // Por defecto, solo mostrar mesas activas
      query = query.where('activo', '==', true);
    }

    const snapshot = await query.get();
    const mesas = [];

    snapshot.forEach(doc => {
      const mesa = Mesa.fromFirestore(doc.id, doc.data());
      mesas.push(mesa.toJSON());
    });

    // Ordenar por número de mesa en memoria
    mesas.sort((a, b) => {
      const numA = a.numeroMesa.toLowerCase();
      const numB = b.numeroMesa.toLowerCase();
      return numA.localeCompare(numB);
    });

    res.status(200).json({
      exito: true,
      datos: mesas,
      total: mesas.length
    });
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener las mesas',
      error: error.message
    });
  }
};

/**
 * Obtener una mesa por ID
 */
const obtenerMesaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('mesas').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mesa no encontrada'
      });
    }

    const mesa = Mesa.fromFirestore(doc.id, doc.data());

    res.status(200).json({
      exito: true,
      datos: mesa.toJSON()
    });
  } catch (error) {
    console.error('Error al obtener mesa:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener la mesa',
      error: error.message
    });
  }
};

/**
 * Actualizar una mesa
 */
const actualizarMesa = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para actualizar mesas'
      });
    }

    const { id } = req.params;
    const { numeroMesa, capacidad, seccion, estado, activo } = req.body;

    const docRef = db.collection('mesas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mesa no encontrada'
      });
    }

    const mesaActual = Mesa.fromFirestore(doc.id, doc.data());

    // Si se está cambiando el número de mesa, verificar que no exista otra con ese número
    if (numeroMesa && numeroMesa !== mesaActual.numeroMesa) {
      const mesasSnapshot = await db.collection('mesas')
        .where('numeroMesa', '==', numeroMesa.trim())
        .where('activo', '==', true)
        .get();

      if (!mesasSnapshot.empty) {
        // Verificar que no sea la misma mesa
        const mesaExistente = mesasSnapshot.docs[0];
        if (mesaExistente.id !== id) {
          return res.status(409).json({
            exito: false,
            mensaje: 'Ya existe otra mesa con ese número'
          });
        }
      }
    }

    // Actualizar solo los campos proporcionados
    if (numeroMesa !== undefined) mesaActual.numeroMesa = numeroMesa;
    if (capacidad !== undefined) mesaActual.capacidad = capacidad;
    if (seccion !== undefined) mesaActual.seccion = seccion;
    if (estado !== undefined) mesaActual.estado = estado;
    if (activo !== undefined) mesaActual.activo = activo;

    // Validar los datos actualizados
    const erroresValidacion = mesaActual.validar();
    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: erroresValidacion
      });
    }

    // Guardar cambios
    await docRef.update(mesaActual.toFirestore());

    res.status(200).json({
      exito: true,
      mensaje: 'Mesa actualizada exitosamente',
      datos: mesaActual.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar la mesa',
      error: error.message
    });
  }
};

/**
 * Cambiar el estado de una mesa
 */
const cambiarEstadoMesa = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    const { id } = req.params;
    const { estado } = req.body;

    const docRef = db.collection('mesas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mesa no encontrada'
      });
    }

    const mesa = Mesa.fromFirestore(doc.id, doc.data());

    // Actualizar estado
    mesa.estado = estado;

    // Validar el estado
    const erroresValidacion = mesa.validarEstado();
    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: erroresValidacion
      });
    }

    // Guardar cambios
    await docRef.update({
      estado: mesa.estado,
      actualizadoEn: new Date().toISOString()
    });

    res.status(200).json({
      exito: true,
      mensaje: `Mesa marcada como ${estado}`,
      datos: mesa.toJSON()
    });
  } catch (error) {
    console.error('Error al cambiar estado de mesa:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cambiar el estado de la mesa',
      error: error.message
    });
  }
};

/**
 * Eliminar una mesa (soft delete)
 */
/**
 * Inicializar mesas basándose en la configuración
 */
const inicializarMesas = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para inicializar mesas'
      });
    }

    // Obtener la configuración del restaurante
    const configSnapshot = await db.collection('configuracion').doc('config_general').get();
    
    if (!configSnapshot.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No se encontró la configuración del restaurante. Por favor, configure el número de mesas primero.'
      });
    }

    const config = configSnapshot.data();
    const numeroMesas = config.restaurante?.numeroMesas || 0;

    if (numeroMesas === 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El número de mesas en la configuración es 0. Por favor, configure el número de mesas primero.'
      });
    }

    // Verificar cuántas mesas activas ya existen
    const mesasExistentes = await db.collection('mesas')
      .where('activo', '==', true)
      .get();

    const totalMesasExistentes = mesasExistentes.size;

    if (totalMesasExistentes >= numeroMesas) {
      return res.status(400).json({
        exito: false,
        mensaje: `Ya existen todas las mesas configuradas (${numeroMesas})`
      });
    }

    // Crear las mesas faltantes
    const mesasCreadas = [];
    const batch = db.batch();

    for (let i = totalMesasExistentes + 1; i <= numeroMesas; i++) {
      const nuevaMesa = new Mesa({
        numeroMesa: `Mesa ${i}`,
        capacidad: 4,
        seccion: 'Sin asignar',
        estado: 'libre'
      });

      const docRef = db.collection('mesas').doc();
      batch.set(docRef, nuevaMesa.toFirestore());
      
      mesasCreadas.push({
        id: docRef.id,
        ...nuevaMesa.toJSON()
      });
    }

    // Ejecutar el batch
    await batch.commit();

    res.status(201).json({
      exito: true,
      mensaje: `Se crearon ${mesasCreadas.length} mesas exitosamente`,
      datos: {
        mesasCreadas: mesasCreadas.length,
        totalMesas: numeroMesas,
        mesas: mesasCreadas
      }
    });
  } catch (error) {
    console.error('Error al inicializar mesas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al inicializar las mesas',
      error: error.message
    });
  }
};

const eliminarMesa = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para eliminar mesas'
      });
    }

    const { id } = req.params;

    const docRef = db.collection('mesas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mesa no encontrada'
      });
    }

    // Soft delete - marcar como inactiva
    await docRef.update({
      activo: false,
      actualizadoEn: new Date().toISOString()
    });

    res.status(200).json({
      exito: true,
      mensaje: 'Mesa eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar la mesa',
      error: error.message
    });
  }
};

module.exports = {
  inicializarMesas,
  obtenerMesas,
  obtenerMesaPorId,
  actualizarMesa,
  cambiarEstadoMesa,
  eliminarMesa
};
