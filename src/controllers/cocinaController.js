const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const Pedido = require('../models/Pedido');

/**
 * Obtener pedidos activos para la cocina
 * Muestra pedidos en estado: pendiente, en_preparacion, listo
 */
const obtenerPedidosCocina = async (req, res) => {
  try {
    const { estado } = req.query;

    // Estados relevantes para cocina
    const estadosCocina = ['pendiente', 'en_preparacion', 'listo'];
    
    let query = db.collection('pedidos')
      .where('activo', '==', true);

    // Si se especifica un estado, filtrar por ese estado
    // Si no, mostrar todos los estados relevantes para cocina
    if (estado) {
      if (!estadosCocina.includes(estado)) {
        return res.status(400).json({
          exito: false,
          mensaje: `Estado inválido para cocina. Debe ser uno de: ${estadosCocina.join(', ')}`
        });
      }
      query = query.where('estado', '==', estado);
    } else {
      // Mostrar solo pedidos pendientes, en preparación o listos
      query = query.where('estado', 'in', estadosCocina);
    }

    const snapshot = await query.get();
    const pedidos = [];

    snapshot.forEach(doc => {
      const pedido = Pedido.fromFirestore(doc.id, doc.data());
      pedidos.push(pedido.toJSON());
    });

    // Ordenar por fecha de creación (más antiguos primero para cocina)
    pedidos.sort((a, b) => new Date(a.creadoEn) - new Date(b.creadoEn));

    // Agrupar por estado para mejor visualización
    const pedidosAgrupados = {
      pendientes: pedidos.filter(p => p.estado === 'pendiente'),
      en_preparacion: pedidos.filter(p => p.estado === 'en_preparacion'),
      listos: pedidos.filter(p => p.estado === 'listo')
    };

    res.status(200).json({
      exito: true,
      datos: {
        pedidos,
        agrupados: pedidosAgrupados,
        totales: {
          pendientes: pedidosAgrupados.pendientes.length,
          en_preparacion: pedidosAgrupados.en_preparacion.length,
          listos: pedidosAgrupados.listos.length,
          total: pedidos.length
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos de cocina:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener los pedidos de cocina',
      error: error.message
    });
  }
};

/**
 * Obtener detalles de un pedido específico para cocina
 */
const obtenerDetallePedidoCocina = async (req, res) => {
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
    console.error('Error al obtener detalle del pedido:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener el detalle del pedido',
      error: error.message
    });
  }
};

/**
 * Iniciar preparación de un pedido (pendiente -> en_preparacion)
 */
const iniciarPreparacion = async (req, res) => {
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
    
    if (pedidoData.estado !== 'pendiente') {
      return res.status(400).json({
        exito: false,
        mensaje: `No se puede iniciar la preparación. El pedido está en estado: ${pedidoData.estado}`
      });
    }

    // Cambiar estado a en_preparacion
    await docRef.update({
      estado: 'en_preparacion',
      actualizadoEn: new Date().toISOString()
    });

    const pedidoActualizado = await docRef.get();
    const pedido = Pedido.fromFirestore(pedidoActualizado.id, pedidoActualizado.data());

    res.status(200).json({
      exito: true,
      mensaje: 'Pedido en preparación',
      datos: pedido.toJSON()
    });
  } catch (error) {
    console.error('Error al iniciar preparación:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al iniciar la preparación del pedido',
      error: error.message
    });
  }
};

/**
 * Marcar pedido como listo (en_preparacion -> listo)
 */
const marcarPedidoListo = async (req, res) => {
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
    
    if (pedidoData.estado !== 'en_preparacion') {
      return res.status(400).json({
        exito: false,
        mensaje: `No se puede marcar como listo. El pedido está en estado: ${pedidoData.estado}`
      });
    }

    // Cambiar estado a listo
    await docRef.update({
      estado: 'listo',
      actualizadoEn: new Date().toISOString()
    });

    const pedidoActualizado = await docRef.get();
    const pedido = Pedido.fromFirestore(pedidoActualizado.id, pedidoActualizado.data());

    res.status(200).json({
      exito: true,
      mensaje: 'Pedido listo para servir',
      datos: pedido.toJSON()
    });
  } catch (error) {
    console.error('Error al marcar pedido como listo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al marcar el pedido como listo',
      error: error.message
    });
  }
};

/**
 * Cambiar estado del pedido desde cocina
 * Permite cambios: pendiente -> en_preparacion -> listo
 */
const cambiarEstadoCocina = async (req, res) => {
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

    // Solo permitir estos estados desde cocina
    const estadosPermitidos = ['pendiente', 'en_preparacion', 'listo'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        exito: false,
        mensaje: `Estado no permitido desde cocina. Use: ${estadosPermitidos.join(', ')}`
      });
    }

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

    const pedidoActualizado = await docRef.get();
    const pedido = Pedido.fromFirestore(pedidoActualizado.id, pedidoActualizado.data());

    res.status(200).json({
      exito: true,
      mensaje: `Estado del pedido actualizado a: ${estado}`,
      datos: pedido.toJSON()
    });
  } catch (error) {
    console.error('Error al cambiar estado desde cocina:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cambiar el estado del pedido',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de cocina
 */
const obtenerEstadisticasCocina = async (req, res) => {
  try {
    const { fecha } = req.query;
    
    // Obtener todos los pedidos activos
    const query = db.collection('pedidos').where('activo', '==', true);
    const snapshot = await query.get();
    
    let pedidos = [];
    snapshot.forEach(doc => {
      const pedido = Pedido.fromFirestore(doc.id, doc.data());
      pedidos.push(pedido.toJSON());
    });

    // Filtrar por fecha en memoria si se proporciona
    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);

      pedidos = pedidos.filter(p => {
        const fechaPedido = new Date(p.creadoEn);
        return fechaPedido >= fechaInicio && fechaPedido <= fechaFin;
      });
    } else {
      // Si no se especifica fecha, usar el día actual
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);

      pedidos = pedidos.filter(p => {
        const fechaPedido = new Date(p.creadoEn);
        return fechaPedido >= hoy && fechaPedido <= finHoy;
      });
    }

    // Calcular estadísticas
    const estadisticas = {
      total_pedidos: pedidos.length,
      pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      en_preparacion: pedidos.filter(p => p.estado === 'en_preparacion').length,
      listos: pedidos.filter(p => p.estado === 'listo').length,
      entregados: pedidos.filter(p => p.estado === 'entregado').length,
      cancelados: pedidos.filter(p => p.estado === 'cancelado').length,
      tiempo_promedio_preparacion: calcularTiempoPromedio(pedidos),
      items_mas_pedidos: obtenerItemsMasPedidos(pedidos)
    };

    res.status(200).json({
      exito: true,
      datos: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de cocina:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener las estadísticas de cocina',
      error: error.message
    });
  }
};

/**
 * Función auxiliar para calcular tiempo promedio de preparación
 */
function calcularTiempoPromedio(pedidos) {
  const pedidosTerminados = pedidos.filter(p => 
    p.estado === 'listo' || p.estado === 'entregado'
  );

  if (pedidosTerminados.length === 0) {
    return 0;
  }

  const tiempos = pedidosTerminados.map(p => {
    const inicio = new Date(p.creadoEn);
    const fin = new Date(p.actualizadoEn);
    return (fin - inicio) / 1000 / 60; // Tiempo en minutos
  });

  const promedio = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
  return Math.round(promedio);
}

/**
 * Función auxiliar para obtener items más pedidos
 */
function obtenerItemsMasPedidos(pedidos) {
  const itemsConteo = {};

  pedidos.forEach(pedido => {
    if (pedido.items && Array.isArray(pedido.items)) {
      pedido.items.forEach(item => {
        if (itemsConteo[item.nombre]) {
          itemsConteo[item.nombre] += item.cantidad;
        } else {
          itemsConteo[item.nombre] = item.cantidad;
        }
      });
    }
  });

  // Convertir a array y ordenar
  const itemsArray = Object.entries(itemsConteo).map(([nombre, cantidad]) => ({
    nombre,
    cantidad
  }));

  itemsArray.sort((a, b) => b.cantidad - a.cantidad);

  return itemsArray.slice(0, 10); // Top 10 items
}

module.exports = {
  obtenerPedidosCocina,
  obtenerDetallePedidoCocina,
  iniciarPreparacion,
  marcarPedidoListo,
  cambiarEstadoCocina,
  obtenerEstadisticasCocina
};
