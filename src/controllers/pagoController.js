const { db } = require('../config/firebase');
const Pago = require('../models/Pago');
const Pedido = require('../models/Pedido');

/**
 * Obtener cuenta de una mesa
 * Trae todos los pedidos activos de la mesa con sus totales
 */
const obtenerCuentaPorMesa = async (req, res) => {
  try {
    const { mesaId } = req.params;

    // Verificar que la mesa existe
    const mesaDoc = await db.collection('mesas').doc(mesaId).get();
    if (!mesaDoc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mesa no encontrada'
      });
    }

    const mesaData = mesaDoc.data();

    // Obtener pedidos activos de la mesa que no estén cancelados
    const pedidosSnapshot = await db.collection('pedidos')
      .where('mesaId', '==', mesaId)
      .where('activo', '==', true)
      .get();

    if (pedidosSnapshot.empty) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No hay pedidos activos para esta mesa'
      });
    }

    const pedidos = [];
    let subtotalTotal = 0;
    let impuestosTotal = 0;

    pedidosSnapshot.forEach(doc => {
      const pedidoData = doc.data();
      // Solo incluir pedidos que no estén cancelados
      if (pedidoData.estado !== 'cancelado') {
        const pedido = Pedido.fromFirestore(doc.id, pedidoData);
        pedidos.push(pedido.toJSON());
        subtotalTotal += pedidoData.subtotal || 0;
        impuestosTotal += pedidoData.impuestos || 0;
      }
    });

    if (pedidos.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No hay pedidos válidos para esta mesa'
      });
    }

    // Obtener configuración de propinas
    const configSnapshot = await db.collection('configuracion').limit(1).get();
    let opcionesPropina = {
      opcion1: 10,
      opcion2: 15,
      opcion3: 20,
      permitirPersonalizada: true
    };

    if (!configSnapshot.empty) {
      const configData = configSnapshot.docs[0].data();
      if (configData.propinas) {
        opcionesPropina = configData.propinas;
      }
    }

    // Calcular propinas sugeridas
    const propinaSugerida1 = subtotalTotal * (opcionesPropina.opcion1 / 100);
    const propinaSugerida2 = subtotalTotal * (opcionesPropina.opcion2 / 100);
    const propinaSugerida3 = subtotalTotal * (opcionesPropina.opcion3 / 100);

    const totalSinPropina = subtotalTotal + impuestosTotal;

    res.status(200).json({
      exito: true,
      datos: {
        mesaId: mesaId,
        numeroMesa: mesaData.numeroMesa || 'Sin número',
        pedidos: pedidos,
        resumen: {
          subtotal: subtotalTotal,
          impuestos: impuestosTotal,
          totalSinPropina: totalSinPropina
        },
        propinas: {
          opcion1: {
            porcentaje: opcionesPropina.opcion1,
            monto: Math.round(propinaSugerida1 * 100) / 100,
            totalConPropina: Math.round((totalSinPropina + propinaSugerida1) * 100) / 100
          },
          opcion2: {
            porcentaje: opcionesPropina.opcion2,
            monto: Math.round(propinaSugerida2 * 100) / 100,
            totalConPropina: Math.round((totalSinPropina + propinaSugerida2) * 100) / 100
          },
          opcion3: {
            porcentaje: opcionesPropina.opcion3,
            monto: Math.round(propinaSugerida3 * 100) / 100,
            totalConPropina: Math.round((totalSinPropina + propinaSugerida3) * 100) / 100
          },
          permitirPersonalizada: opcionesPropina.permitirPersonalizada
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener la cuenta de la mesa',
      error: error.message
    });
  }
};

/**
 * Dividir cuenta entre varias personas
 * Permite asignar items específicos a cada persona
 */
const dividirCuenta = async (req, res) => {
  try {
    const { mesaId, numeroDivisiones, divisiones } = req.body;

    // Validaciones
    if (!mesaId || !numeroDivisiones) {
      return res.status(400).json({
        exito: false,
        mensaje: 'mesaId y numeroDivisiones son requeridos'
      });
    }

    if (numeroDivisiones < 2 || numeroDivisiones > 20) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El número de divisiones debe estar entre 2 y 20'
      });
    }

    if (!divisiones || !Array.isArray(divisiones) || divisiones.length !== numeroDivisiones) {
      return res.status(400).json({
        exito: false,
        mensaje: `Debe proporcionar exactamente ${numeroDivisiones} divisiones`
      });
    }

    // Verificar que la mesa existe
    const mesaDoc = await db.collection('mesas').doc(mesaId).get();
    if (!mesaDoc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mesa no encontrada'
      });
    }

    const mesaData = mesaDoc.data();

    // Obtener pedidos activos de la mesa
    const pedidosSnapshot = await db.collection('pedidos')
      .where('mesaId', '==', mesaId)
      .where('activo', '==', true)
      .get();

    if (pedidosSnapshot.empty) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No hay pedidos activos para esta mesa'
      });
    }

    // Recopilar todos los items de los pedidos
    const todosLosItems = [];
    const pedidosIds = [];

    pedidosSnapshot.forEach(doc => {
      const pedidoData = doc.data();
      if (pedidoData.estado !== 'cancelado') {
        pedidosIds.push(doc.id);
        if (pedidoData.items && Array.isArray(pedidoData.items)) {
          pedidoData.items.forEach(item => {
            todosLosItems.push({
              ...item,
              pedidoId: doc.id
            });
          });
        }
      }
    });

    // Validar que cada división tenga items asignados
    const divisionesCalculadas = divisiones.map((division, index) => {
      if (!division.items || !Array.isArray(division.items)) {
        throw new Error(`La división ${index + 1} debe tener un array de items`);
      }

      let subtotal = 0;
      let impuestos = 0;

      division.items.forEach(item => {
        subtotal += item.subtotal || 0;
        // Calcular impuestos proporcionales (asumiendo que ya están calculados en el pedido)
        const itemOriginal = todosLosItems.find(i => 
          i.itemId === item.itemId && i.pedidoId === item.pedidoId
        );
        if (itemOriginal) {
          // Calcular impuestos proporcionales
          const porcentajeImpuesto = 0.16; // Obtener de configuración
          impuestos += (item.subtotal * porcentajeImpuesto);
        }
      });

      const total = subtotal + impuestos;

      return {
        numero: index + 1,
        items: division.items,
        subtotal: Math.round(subtotal * 100) / 100,
        impuestos: Math.round(impuestos * 100) / 100,
        total: Math.round(total * 100) / 100,
        propina: 0,
        totalConPropina: Math.round(total * 100) / 100
      };
    });

    // Calcular totales generales
    const subtotalGeneral = divisionesCalculadas.reduce((sum, div) => sum + div.subtotal, 0);
    const impuestosGeneral = divisionesCalculadas.reduce((sum, div) => sum + div.impuestos, 0);
    const totalGeneral = divisionesCalculadas.reduce((sum, div) => sum + div.total, 0);

    res.status(200).json({
      exito: true,
      mensaje: 'Cuenta dividida exitosamente',
      datos: {
        mesaId: mesaId,
        numeroMesa: mesaData.numeroMesa || 'Sin número',
        pedidoIds: pedidosIds,
        cuentaDividida: true,
        numeroDivisiones: numeroDivisiones,
        divisiones: divisionesCalculadas,
        totales: {
          subtotal: Math.round(subtotalGeneral * 100) / 100,
          impuestos: Math.round(impuestosGeneral * 100) / 100,
          total: Math.round(totalGeneral * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Error al dividir cuenta:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al dividir la cuenta',
      error: error.message
    });
  }
};

/**
 * Procesar pago
 * Registra el pago y actualiza el estado de los pedidos
 */
const procesarPago = async (req, res) => {
  try {
    const {
      mesaId,
      metodoPago,
      propina,
      propinaPersonalizada,
      porcentajePropina,
      cuentaDividida,
      numeroDivisiones,
      divisiones
    } = req.body;

    // Validaciones
    if (!mesaId || !metodoPago) {
      return res.status(400).json({
        exito: false,
        mensaje: 'mesaId y metodoPago son requeridos'
      });
    }

    if (!Pago.validarMetodoPago(metodoPago)) {
      return res.status(400).json({
        exito: false,
        mensaje: `Método de pago inválido. Debe ser: ${Pago.obtenerMetodosPago().join(', ')}`
      });
    }

    // Verificar que la mesa existe
    const mesaDoc = await db.collection('mesas').doc(mesaId).get();
    if (!mesaDoc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mesa no encontrada'
      });
    }

    const mesaData = mesaDoc.data();

    // Obtener pedidos activos de la mesa
    const pedidosSnapshot = await db.collection('pedidos')
      .where('mesaId', '==', mesaId)
      .where('activo', '==', true)
      .get();

    if (pedidosSnapshot.empty) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No hay pedidos activos para esta mesa'
      });
    }

    const pedidosIds = [];
    let subtotalTotal = 0;
    let impuestosTotal = 0;

    pedidosSnapshot.forEach(doc => {
      const pedidoData = doc.data();
      if (pedidoData.estado !== 'cancelado') {
        pedidosIds.push(doc.id);
        subtotalTotal += pedidoData.subtotal || 0;
        impuestosTotal += pedidoData.impuestos || 0;
      }
    });

    // Calcular propina si no se proporciona
    let propinaFinal = propina || 0;
    let porcentajePropinaFinal = porcentajePropina || 0;
    let esPropinaPersonalizada = propinaPersonalizada || false;

    if (propina && !porcentajePropina) {
      // Propina personalizada por monto
      esPropinaPersonalizada = true;
      porcentajePropinaFinal = (propina / subtotalTotal) * 100;
    } else if (porcentajePropina && !propina) {
      // Propina por porcentaje
      propinaFinal = subtotalTotal * (porcentajePropina / 100);
    }

    const totalSinPropina = subtotalTotal + impuestosTotal;
    const totalFinal = totalSinPropina + propinaFinal;

    // Crear registro de pago
    const pago = new Pago({
      mesaId: mesaId,
      numeroMesa: mesaData.numeroMesa || 'Sin número',
      pedidoIds: pedidosIds,
      metodoPago: metodoPago,
      subtotal: subtotalTotal,
      impuestos: impuestosTotal,
      propina: Math.round(propinaFinal * 100) / 100,
      propinaPersonalizada: esPropinaPersonalizada,
      porcentajePropina: Math.round(porcentajePropinaFinal * 100) / 100,
      total: Math.round(totalFinal * 100) / 100,
      cuentaDividida: cuentaDividida || false,
      numeroDivisiones: numeroDivisiones || 1,
      divisiones: divisiones || [],
      estado: 'pagado',
      pagoCompletado: true,
      cajeroId: req.usuario.uid,
      cajeroNombre: req.usuario.correoElectronico
    });

    // Guardar pago en Firestore
    const pagoData = pago.toJSON();
    delete pagoData.id; // Eliminar el campo id antes de guardar
    
    const pagoRef = await db.collection('pagos').add(pagoData);

    pago.id = pagoRef.id;

    // Actualizar estado de los pedidos a 'entregado'
    const batch = db.batch();
    pedidosSnapshot.forEach(doc => {
      const pedidoData = doc.data();
      if (pedidoData.estado !== 'cancelado') {
        batch.update(doc.ref, {
          estado: 'entregado',
          actualizadoEn: new Date().toISOString()
        });
      }
    });

    // Cambiar estado de la mesa a 'en_limpieza'
    batch.update(mesaDoc.ref, {
      estado: 'en_limpieza',
      actualizadoEn: new Date().toISOString()
    });

    await batch.commit();

    res.status(201).json({
      exito: true,
      mensaje: 'Pago procesado exitosamente',
      datos: pago.toJSON()
    });
  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al procesar el pago',
      error: error.message
    });
  }
};

/**
 * Obtener historial de pagos
 * Con filtros opcionales
 */
const obtenerPagos = async (req, res) => {
  try {
    const { fecha, metodoPago, mesaId } = req.query;
    let query = db.collection('pagos');

    // Filtrar por método de pago
    if (metodoPago) {
      if (!Pago.validarMetodoPago(metodoPago)) {
        return res.status(400).json({
          exito: false,
          mensaje: `Método de pago inválido. Debe ser: ${Pago.obtenerMetodosPago().join(', ')}`
        });
      }
      query = query.where('metodoPago', '==', metodoPago);
    }

    // Filtrar por mesa
    if (mesaId) {
      query = query.where('mesaId', '==', mesaId);
    }

    const snapshot = await query.get();
    let pagos = [];

    snapshot.forEach(doc => {
      const pago = Pago.fromFirestore(doc.id, doc.data());
      pagos.push(pago.toJSON());
    });

    // Filtrar por fecha en memoria si se proporciona
    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);

      pagos = pagos.filter(p => {
        const fechaPago = new Date(p.creadoEn);
        return fechaPago >= fechaInicio && fechaPago <= fechaFin;
      });
    }

    // Ordenar por fecha (más recientes primero)
    pagos.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

    // Calcular totales
    const totalGeneral = pagos.reduce((sum, p) => sum + p.total, 0);
    const totalPropinas = pagos.reduce((sum, p) => sum + p.propina, 0);

    res.status(200).json({
      exito: true,
      datos: {
        pagos: pagos,
        total: pagos.length,
        totales: {
          totalVentas: Math.round(totalGeneral * 100) / 100,
          totalPropinas: Math.round(totalPropinas * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener el historial de pagos',
      error: error.message
    });
  }
};

/**
 * Obtener detalle de un pago
 */
const obtenerPagoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const pagoDoc = await db.collection('pagos').doc(id).get();

    if (!pagoDoc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Pago no encontrado'
      });
    }

    const pago = Pago.fromFirestore(pagoDoc.id, pagoDoc.data());

    res.status(200).json({
      exito: true,
      datos: pago.toJSON()
    });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener el pago',
      error: error.message
    });
  }
};

module.exports = {
  obtenerCuentaPorMesa,
  dividirCuenta,
  procesarPago,
  obtenerPagos,
  obtenerPagoPorId
};
