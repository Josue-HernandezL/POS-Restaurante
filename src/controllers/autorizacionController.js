const { db } = require('../config/firebase');
const Autorizacion = require('../models/Autorizacion');

/**
 * Registra una nueva autorización en el sistema
 * @route POST /api/autorizaciones
 */
const registrarAutorizacion = async (req, res) => {
  try {
    const {
      accion,
      modulo,
      detalles,
      autorizadoPorId,
      autorizadoPorNombre,
      autorizadoPorRol,
      resultado,
      requiereAutorizacion
    } = req.body;

    // Crear la autorización
    const autorizacion = new Autorizacion({
      accion,
      modulo,
      usuarioId: req.usuario.uid,
      usuarioNombre: req.usuario.correoElectronico || req.usuario.email,
      usuarioRol: req.usuario.rol || 'admin',
      autorizadoPorId,
      autorizadoPorNombre,
      autorizadoPorRol,
      detalles: detalles || {},
      ipAddress: req.ip,
      resultado: resultado || Autorizacion.RESULTADOS.EXITOSO,
      requiereAutorizacion: requiereAutorizacion || false,
      autorizado: true
    });

    // Validar datos
    const validacion = autorizacion.validar();
    if (!validacion.valido) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Datos inválidos',
        errores: validacion.errores
      });
    }

    // Guardar en Firestore
    const autorizacionData = autorizacion.toFirestore();
    const docRef = await db.collection('autorizaciones').add(autorizacionData);

    autorizacion.id = docRef.id;

    res.status(201).json({
      exito: true,
      mensaje: 'Autorización registrada exitosamente',
      datos: autorizacion.toJSON()
    });

  } catch (error) {
    console.error('Error al registrar autorización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al registrar autorización',
      error: error.message
    });
  }
};

/**
 * Obtiene el historial de autorizaciones con filtros
 * @route GET /api/autorizaciones
 */
const obtenerAutorizaciones = async (req, res) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      accion,
      modulo,
      usuarioId,
      autorizadoPorId,
      resultado,
      limite = 50
    } = req.query;

    let query = db.collection('autorizaciones');

    // Aplicar filtros
    if (modulo) {
      query = query.where('modulo', '==', modulo);
    }

    if (accion) {
      query = query.where('accion', '==', accion);
    }

    if (usuarioId) {
      query = query.where('usuario.id', '==', usuarioId);
    }

    if (autorizadoPorId) {
      query = query.where('autorizadoPor.id', '==', autorizadoPorId);
    }

    if (resultado) {
      query = query.where('resultado', '==', resultado);
    }

    // Filtrar por rango de fechas si se proporciona
    if (fechaInicio) {
      query = query.where('fechaHora', '>=', fechaInicio);
    }

    if (fechaFin) {
      query = query.where('fechaHora', '<=', fechaFin);
    }

    // Ordenar por fecha descendente y limitar resultados
    query = query.orderBy('fechaHora', 'desc').limit(parseInt(limite));

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.json({
        exito: true,
        datos: [],
        total: 0
      });
    }

    const autorizaciones = [];
    snapshot.forEach(doc => {
      const autorizacion = Autorizacion.fromFirestore(doc.id, doc.data());
      autorizaciones.push(autorizacion.toJSON());
    });

    res.json({
      exito: true,
      datos: autorizaciones,
      total: autorizaciones.length,
      filtros: {
        fechaInicio,
        fechaFin,
        accion,
        modulo,
        usuarioId,
        autorizadoPorId,
        resultado
      }
    });

  } catch (error) {
    console.error('Error al obtener autorizaciones:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener autorizaciones',
      error: error.message
    });
  }
};

/**
 * Obtiene una autorización específica por ID
 * @route GET /api/autorizaciones/:id
 */
const obtenerAutorizacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('autorizaciones').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Autorización no encontrada'
      });
    }

    const autorizacion = Autorizacion.fromFirestore(doc.id, doc.data());

    res.json({
      exito: true,
      datos: autorizacion.toJSON()
    });

  } catch (error) {
    console.error('Error al obtener autorización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener autorización',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas de autorizaciones
 * @route GET /api/autorizaciones/estadisticas
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let query = db.collection('autorizaciones');

    // Filtrar por rango de fechas si se proporciona
    if (fechaInicio) {
      query = query.where('fechaHora', '>=', fechaInicio);
    }

    if (fechaFin) {
      query = query.where('fechaHora', '<=', fechaFin);
    }

    const snapshot = await query.get();

    // Calcular estadísticas
    const estadisticas = {
      total: 0,
      porModulo: {},
      porAccion: {},
      porResultado: {
        exitoso: 0,
        fallido: 0,
        pendiente: 0
      },
      porUsuario: {},
      requierenAutorizacion: 0
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      estadisticas.total++;

      // Por módulo
      if (data.modulo) {
        estadisticas.porModulo[data.modulo] = (estadisticas.porModulo[data.modulo] || 0) + 1;
      }

      // Por acción
      if (data.accion) {
        estadisticas.porAccion[data.accion] = (estadisticas.porAccion[data.accion] || 0) + 1;
      }

      // Por resultado
      if (data.resultado) {
        estadisticas.porResultado[data.resultado]++;
      }

      // Por usuario
      if (data.usuario?.nombre) {
        estadisticas.porUsuario[data.usuario.nombre] = (estadisticas.porUsuario[data.usuario.nombre] || 0) + 1;
      }

      // Requieren autorización
      if (data.requiereAutorizacion) {
        estadisticas.requierenAutorizacion++;
      }
    });

    res.json({
      exito: true,
      datos: estadisticas,
      periodo: {
        fechaInicio: fechaInicio || 'Sin filtro',
        fechaFin: fechaFin || 'Sin filtro'
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Obtiene autorizaciones de un usuario específico
 * @route GET /api/autorizaciones/usuario/:usuarioId
 */
const obtenerAutorizacionesPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limite = 50 } = req.query;

    const snapshot = await db.collection('autorizaciones')
      .where('usuario.id', '==', usuarioId)
      .orderBy('fechaHora', 'desc')
      .limit(parseInt(limite))
      .get();

    if (snapshot.empty) {
      return res.json({
        exito: true,
        datos: [],
        total: 0
      });
    }

    const autorizaciones = [];
    snapshot.forEach(doc => {
      const autorizacion = Autorizacion.fromFirestore(doc.id, doc.data());
      autorizaciones.push(autorizacion.toJSON());
    });

    res.json({
      exito: true,
      datos: autorizaciones,
      total: autorizaciones.length
    });

  } catch (error) {
    console.error('Error al obtener autorizaciones del usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener autorizaciones del usuario',
      error: error.message
    });
  }
};

module.exports = {
  registrarAutorizacion,
  obtenerAutorizaciones,
  obtenerAutorizacionPorId,
  obtenerEstadisticas,
  obtenerAutorizacionesPorUsuario
};
