const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const Pedido = require('../models/Pedido');

/**
 * Crear un nuevo pedido
 */
const crearPedido = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    const { mesaId, items, observaciones } = req.body;

    // Verificar que la mesa existe y está activa
    const mesaDoc = await db.collection('mesas').doc(mesaId).get();
    if (!mesaDoc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mesa no encontrada'
      });
    }

    const mesaData = mesaDoc.data();
    if (!mesaData.activo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La mesa no está activa'
      });
    }

    // Verificar que todos los items existen y obtener sus datos
    const itemsConDatos = [];
    for (const item of items) {
      const itemDoc = await db.collection('items').doc(item.itemId).get();
      
      if (!itemDoc.exists) {
        return res.status(404).json({
          exito: false,
          mensaje: `Item con ID ${item.itemId} no encontrado`
        });
      }

      const itemData = itemDoc.data();
      
      if (!itemData.activo) {
        return res.status(400).json({
          exito: false,
          mensaje: `El item "${itemData.nombre}" no está disponible`
        });
      }

      if (!itemData.disponibilidad) {
        return res.status(400).json({
          exito: false,
          mensaje: `El item "${itemData.nombre}" no está disponible en este momento`
        });
      }

      // Agregar item con sus datos completos
      itemsConDatos.push({
        itemId: item.itemId,
        nombre: itemData.nombre,
        descripcion: itemData.descripcion || '',
        categoria: itemData.categoria || '',
        precioUnitario: itemData.precio,
        cantidad: item.cantidad,
        observaciones: item.observaciones || '',
        subtotal: itemData.precio * item.cantidad
      });
    }

    // Obtener configuración de impuestos
    const configDoc = await db.collection('configuracion').doc('config_general').get();
    let porcentajeIVA = 16; // Valor por defecto
    if (configDoc.exists) {
      const config = configDoc.data();
      porcentajeIVA = config.impuestos?.porcentajeIVA || 16;
    }

    // Crear nuevo pedido
    const nuevoPedido = new Pedido({
      mesaId,
      numeroMesa: mesaData.numeroMesa,
      items: itemsConDatos,
      observaciones: observaciones || '',
      meseroId: req.usuario.uid,
      meseroNombre: req.usuario.nombreCompleto || req.usuario.correoElectronico,
      estado: 'pendiente'
    });

    // Calcular totales
    nuevoPedido.calcularTotales(porcentajeIVA);

    // Validar los datos
    const erroresValidacion = nuevoPedido.validar();
    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: erroresValidacion
      });
    }

    // Guardar en Firestore
    const docRef = await db.collection('pedidos').add(nuevoPedido.toFirestore());
    const pedidoCreado = Pedido.fromFirestore(docRef.id, nuevoPedido.toFirestore());

    // Actualizar estado de la mesa a 'ocupada' si está libre
    if (mesaData.estado === 'libre') {
      await db.collection('mesas').doc(mesaId).update({
        estado: 'ocupada',
        actualizadoEn: new Date().toISOString()
      });
    }

    res.status(201).json({
      exito: true,
      mensaje: 'Pedido creado exitosamente',
      datos: pedidoCreado.toJSON()
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear el pedido',
      error: error.message
    });
  }
};

/**
 * Obtener todos los pedidos con filtros opcionales
 */
const obtenerPedidos = async (req, res) => {
  try {
    const { estado, mesaId, fecha } = req.query;
    let query = db.collection('pedidos');

    // Filtrar por estado si se proporciona
    if (estado) {
      if (!Pedido.ESTADOS.includes(estado)) {
        return res.status(400).json({
          exito: false,
          mensaje: `Estado inválido. Debe ser uno de: ${Pedido.ESTADOS.join(', ')}`
        });
      }
      query = query.where('estado', '==', estado);
    }

    // Filtrar por mesa si se proporciona
    if (mesaId) {
      query = query.where('mesaId', '==', mesaId);
    }

    // Filtrar por fecha si se proporciona (formato: YYYY-MM-DD)
    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);

      query = query
        .where('creadoEn', '>=', fechaInicio.toISOString())
        .where('creadoEn', '<=', fechaFin.toISOString());
    }

    // Solo mostrar pedidos activos por defecto
    query = query.where('activo', '==', true);

    const snapshot = await query.get();
    const pedidos = [];

    snapshot.forEach(doc => {
      const pedido = Pedido.fromFirestore(doc.id, doc.data());
      pedidos.push(pedido.toJSON());
    });

    // Ordenar por fecha de creación (más recientes primero)
    pedidos.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

    res.status(200).json({
      exito: true,
      datos: {
        pedidos,
        total: pedidos.length
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener los pedidos',
      error: error.message
    });
  }
};

/**
 * Obtener un pedido por ID
 */
const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('pedidos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Pedido no encontrado'
      });
    }

    const pedido = Pedido.fromFirestore(doc.id, doc.data());

    res.status(200).json({
      exito: true,
      datos: pedido.toJSON()
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener el pedido',
      error: error.message
    });
  }
};

/**
 * Actualizar un pedido
 */
const actualizarPedido = async (req, res) => {
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
    const { items, observaciones } = req.body;

    const docRef = db.collection('pedidos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Pedido no encontrado'
      });
    }

    const pedidoData = doc.data();
    
    // Solo se pueden actualizar pedidos en estado 'pendiente'
    if (pedidoData.estado !== 'pendiente') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Solo se pueden modificar pedidos en estado pendiente'
      });
    }

    const datosActualizar = {
      actualizadoEn: new Date().toISOString()
    };

    // Si se envían items, verificar y actualizar
    if (items && Array.isArray(items)) {
      const itemsConDatos = [];
      
      for (const item of items) {
        const itemDoc = await db.collection('items').doc(item.itemId).get();
        
        if (!itemDoc.exists) {
          return res.status(404).json({
            exito: false,
            mensaje: `Item con ID ${item.itemId} no encontrado`
          });
        }

        const itemData = itemDoc.data();
        
        if (!itemData.activo || !itemData.disponibilidad) {
          return res.status(400).json({
            exito: false,
            mensaje: `El item "${itemData.nombre}" no está disponible`
          });
        }

        itemsConDatos.push({
          itemId: item.itemId,
          nombre: itemData.nombre,
          descripcion: itemData.descripcion || '',
          categoria: itemData.categoria || '',
          precioUnitario: itemData.precio,
          cantidad: item.cantidad,
          observaciones: item.observaciones || '',
          subtotal: itemData.precio * item.cantidad
        });
      }

      // Obtener configuración de impuestos
      const configDoc = await db.collection('configuracion').doc('config_general').get();
      let porcentajeIVA = 16;
      if (configDoc.exists) {
        const config = configDoc.data();
        porcentajeIVA = config.impuestos?.porcentajeIVA || 16;
      }

      // Crear pedido temporal para calcular totales
      const pedidoTemp = new Pedido({ ...pedidoData, items: itemsConDatos });
      pedidoTemp.calcularTotales(porcentajeIVA);

      datosActualizar.items = itemsConDatos;
      datosActualizar.subtotal = pedidoTemp.subtotal;
      datosActualizar.impuestos = pedidoTemp.impuestos;
      datosActualizar.total = pedidoTemp.total;
    }

    // Actualizar observaciones si se proporcionan
    if (observaciones !== undefined) {
      if (observaciones.length > 500) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Las observaciones no pueden exceder 500 caracteres'
        });
      }
      datosActualizar.observaciones = observaciones;
    }

    await docRef.update(datosActualizar);

    const pedidoActualizado = await docRef.get();
    const pedido = Pedido.fromFirestore(pedidoActualizado.id, pedidoActualizado.data());

    res.status(200).json({
      exito: true,
      mensaje: 'Pedido actualizado exitosamente',
      datos: pedido.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar el pedido',
      error: error.message
    });
  }
};

/**
 * Cambiar el estado de un pedido
 */
const cambiarEstadoPedido = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    const { id } = req.params;
    const { estado } = req.body;

    const docRef = db.collection('pedidos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Pedido no encontrado'
      });
    }

    const pedidoActual = new Pedido(doc.data());
    
    // Validar transición de estado
    const validacion = pedidoActual.validarEstado(estado);
    if (!validacion.valido) {
      return res.status(400).json({
        exito: false,
        mensaje: validacion.mensaje
      });
    }

    // Actualizar estado
    await docRef.update({
      estado,
      actualizadoEn: new Date().toISOString()
    });

    // Si el pedido se entrega o cancela, liberar la mesa si no hay más pedidos activos
    if (estado === 'entregado' || estado === 'cancelado') {
      const pedidosActivos = await db.collection('pedidos')
        .where('mesaId', '==', pedidoActual.mesaId)
        .where('estado', 'in', ['pendiente', 'en_preparacion', 'listo'])
        .where('activo', '==', true)
        .get();

      if (pedidosActivos.empty) {
        await db.collection('mesas').doc(pedidoActual.mesaId).update({
          estado: 'en_limpieza',
          actualizadoEn: new Date().toISOString()
        });
      }
    }

    const pedidoActualizado = await docRef.get();
    const pedido = Pedido.fromFirestore(pedidoActualizado.id, pedidoActualizado.data());

    res.status(200).json({
      exito: true,
      mensaje: 'Estado del pedido actualizado exitosamente',
      datos: pedido.toJSON()
    });
  } catch (error) {
    console.error('Error al cambiar estado del pedido:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cambiar el estado del pedido',
      error: error.message
    });
  }
};

/**
 * Cancelar un pedido
 */
const cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('pedidos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Pedido no encontrado'
      });
    }

    const pedidoData = doc.data();
    
    // Solo se pueden cancelar pedidos que no estén entregados
    if (pedidoData.estado === 'entregado') {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se puede cancelar un pedido ya entregado'
      });
    }

    if (pedidoData.estado === 'cancelado') {
      return res.status(400).json({
        exito: false,
        mensaje: 'El pedido ya está cancelado'
      });
    }

    // Soft delete - marcar como cancelado
    await docRef.update({
      estado: 'cancelado',
      actualizadoEn: new Date().toISOString()
    });

    // Verificar si hay más pedidos activos en la mesa
    const pedidosActivos = await db.collection('pedidos')
      .where('mesaId', '==', pedidoData.mesaId)
      .where('estado', 'in', ['pendiente', 'en_preparacion', 'listo'])
      .where('activo', '==', true)
      .get();

    if (pedidosActivos.empty) {
      await db.collection('mesas').doc(pedidoData.mesaId).update({
        estado: 'libre',
        actualizadoEn: new Date().toISOString()
      });
    }

    res.status(200).json({
      exito: true,
      mensaje: 'Pedido cancelado exitosamente'
    });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cancelar el pedido',
      error: error.message
    });
  }
};

/**
 * Eliminar un pedido (soft delete)
 */
const eliminarPedido = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para eliminar pedidos'
      });
    }

    const { id } = req.params;

    const docRef = db.collection('pedidos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Pedido no encontrado'
      });
    }

    // Soft delete - marcar como inactivo
    await docRef.update({
      activo: false,
      actualizadoEn: new Date().toISOString()
    });

    res.status(200).json({
      exito: true,
      mensaje: 'Pedido eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar el pedido',
      error: error.message
    });
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  cambiarEstadoPedido,
  cancelarPedido,
  eliminarPedido
};
