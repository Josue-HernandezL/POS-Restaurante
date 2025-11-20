const { db } = require('../config/firebase');
const Reservacion = require('../models/Reservacion');

// Colección de reservaciones en Firestore
const reservacionesCollection = db.collection('reservaciones');

/**
 * Crear una nueva reservación
 */
const crearReservacion = async (req, res) => {
  try {
    const { nombreCliente, telefono, fecha, hora, numeroPersonas, mesaAsignada, notas } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!nombreCliente || !telefono || !fecha || !hora || !numeroPersonas || !mesaAsignada) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Nombre del cliente, teléfono, fecha, hora, número de personas y mesa asignada son requeridos',
      });
    }

    // Validar número de personas
    if (!Reservacion.validarNumeroPersonas(numeroPersonas)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El número de personas debe ser entre 1 y 20',
      });
    }

    // Validar formato de teléfono (al menos 10 dígitos)
    const telefonoLimpio = telefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 10) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El teléfono debe tener al menos 10 dígitos',
      });
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La fecha debe estar en formato YYYY-MM-DD',
      });
    }

    // Validar formato de hora (HH:MM)
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(hora)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La hora debe estar en formato HH:MM (24 horas)',
      });
    }

    // Validar que la fecha no sea en el pasado
    const fechaReservacion = new Date(`${fecha}T${hora}`);
    const ahora = new Date();
    if (fechaReservacion < ahora) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se pueden crear reservaciones en el pasado',
      });
    }

    // Verificar disponibilidad de la mesa en esa fecha y hora
    const reservacionesExistentes = await reservacionesCollection
      .where('fecha', '==', fecha)
      .where('mesaAsignada', '==', mesaAsignada.trim())
      .where('estado', 'in', ['pendiente', 'confirmada', 'sentada'])
      .get();

    if (!reservacionesExistentes.empty) {
      // Verificar si hay conflicto de horario (dentro de 2 horas)
      for (const doc of reservacionesExistentes.docs) {
        const reservacionData = doc.data();
        const horaExistente = reservacionData.hora;
        
        // Calcular diferencia en minutos
        const [horaH, horaM] = hora.split(':').map(Number);
        const [existenteH, existenteM] = horaExistente.split(':').map(Number);
        const minutosSolicitados = horaH * 60 + horaM;
        const minutosExistentes = existenteH * 60 + existenteM;
        const diferencia = Math.abs(minutosSolicitados - minutosExistentes);

        if (diferencia < 120) { // Menos de 2 horas de diferencia
          return res.status(409).json({
            exito: false,
            mensaje: 'La mesa ya está reservada en ese horario. Por favor, selecciona otra mesa u horario',
            reservacionExistente: {
              hora: horaExistente,
              nombreCliente: reservacionData.nombreCliente,
            },
          });
        }
      }
    }

    // Crear nueva reservación
    const nuevaReservacion = new Reservacion({
      nombreCliente: nombreCliente.trim(),
      telefono: telefono.trim(),
      fecha,
      hora,
      numeroPersonas: parseInt(numeroPersonas),
      mesaAsignada: mesaAsignada.trim(),
      notas: notas ? notas.trim() : '',
      estado: 'pendiente',
      creadoPor: req.usuario.uid,
    });

    // Guardar en Firestore
    const docRef = await reservacionesCollection.add(nuevaReservacion.toFirestore());

    return res.status(201).json({
      exito: true,
      mensaje: 'Reservación creada exitosamente',
      datos: {
        id: docRef.id,
        ...nuevaReservacion.toJSON(),
      },
    });
  } catch (error) {
    console.error('Error al crear reservación:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al crear reservación',
      error: error.message,
    });
  }
};

/**
 * Obtener todas las reservaciones
 */
const obtenerReservaciones = async (req, res) => {
  try {
    const { fecha, estado, mesaAsignada } = req.query;

    let query = reservacionesCollection;

    // Filtrar por fecha si se especifica
    if (fecha) {
      query = query.where('fecha', '==', fecha);
    }

    // Filtrar por estado si se especifica
    if (estado) {
      if (!Reservacion.validarEstado(estado)) {
        return res.status(400).json({
          exito: false,
          mensaje: `Estado inválido. Los estados válidos son: ${Reservacion.obtenerEstados().join(', ')}`,
        });
      }
      query = query.where('estado', '==', estado);
    }

    // Filtrar por mesa si se especifica
    if (mesaAsignada) {
      query = query.where('mesaAsignada', '==', mesaAsignada);
    }

    const snapshot = await query.orderBy('fecha', 'desc').orderBy('hora', 'desc').get();

    const reservaciones = [];
    snapshot.forEach((doc) => {
      reservaciones.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      exito: true,
      datos: reservaciones,
      total: reservaciones.length,
    });
  } catch (error) {
    console.error('Error al obtener reservaciones:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener reservaciones',
      error: error.message,
    });
  }
};

/**
 * Obtener una reservación por ID
 */
const obtenerReservacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await reservacionesCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Reservación no encontrada',
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
    console.error('Error al obtener reservación:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener reservación',
      error: error.message,
    });
  }
};

/**
 * Actualizar una reservación
 */
const actualizarReservacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreCliente, telefono, fecha, hora, numeroPersonas, mesaAsignada, notas, estado } = req.body;

    // Verificar que la reservación existe
    const doc = await reservacionesCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Reservación no encontrada',
      });
    }

    const reservacionActual = doc.data();

    // No permitir actualizar reservaciones terminadas o canceladas
    if (reservacionActual.estado === 'terminada' || reservacionActual.estado === 'cancelada') {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se pueden actualizar reservaciones terminadas o canceladas',
      });
    }

    // Preparar datos para actualizar
    const datosActualizados = {
      actualizadoEn: new Date(),
    };

    if (nombreCliente !== undefined) {
      datosActualizados.nombreCliente = nombreCliente.trim();
    }

    if (telefono !== undefined) {
      const telefonoLimpio = telefono.replace(/\D/g, '');
      if (telefonoLimpio.length < 10) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El teléfono debe tener al menos 10 dígitos',
        });
      }
      datosActualizados.telefono = telefono.trim();
    }

    if (fecha !== undefined) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La fecha debe estar en formato YYYY-MM-DD',
        });
      }
      datosActualizados.fecha = fecha;
    }

    if (hora !== undefined) {
      const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!horaRegex.test(hora)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La hora debe estar en formato HH:MM (24 horas)',
        });
      }
      datosActualizados.hora = hora;
    }

    if (numeroPersonas !== undefined) {
      if (!Reservacion.validarNumeroPersonas(numeroPersonas)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El número de personas debe ser entre 1 y 20',
        });
      }
      datosActualizados.numeroPersonas = parseInt(numeroPersonas);
    }

    if (mesaAsignada !== undefined) {
      datosActualizados.mesaAsignada = mesaAsignada.trim();
    }

    if (notas !== undefined) {
      datosActualizados.notas = notas.trim();
    }

    if (estado !== undefined) {
      if (!Reservacion.validarEstado(estado)) {
        return res.status(400).json({
          exito: false,
          mensaje: `Estado inválido. Los estados válidos son: ${Reservacion.obtenerEstados().join(', ')}`,
        });
      }
      datosActualizados.estado = estado;
    }

    // Actualizar en Firestore
    await reservacionesCollection.doc(id).update(datosActualizados);

    // Obtener datos actualizados
    const docActualizado = await reservacionesCollection.doc(id).get();

    return res.status(200).json({
      exito: true,
      mensaje: 'Reservación actualizada exitosamente',
      datos: {
        id: docActualizado.id,
        ...docActualizado.data(),
      },
    });
  } catch (error) {
    console.error('Error al actualizar reservación:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar reservación',
      error: error.message,
    });
  }
};

/**
 * Marcar reservación como sentada
 */
const marcarComoSentada = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await reservacionesCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Reservación no encontrada',
      });
    }

    const reservacion = doc.data();

    if (reservacion.estado !== 'pendiente' && reservacion.estado !== 'confirmada') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Solo se pueden sentar reservaciones pendientes o confirmadas',
      });
    }

    await reservacionesCollection.doc(id).update({
      estado: 'sentada',
      actualizadoEn: new Date(),
    });

    const docActualizado = await reservacionesCollection.doc(id).get();

    return res.status(200).json({
      exito: true,
      mensaje: 'Reservación marcada como sentada',
      datos: {
        id: docActualizado.id,
        ...docActualizado.data(),
      },
    });
  } catch (error) {
    console.error('Error al marcar reservación como sentada:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al marcar reservación como sentada',
      error: error.message,
    });
  }
};

/**
 * Marcar reservación como terminada
 */
const marcarComoTerminada = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await reservacionesCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Reservación no encontrada',
      });
    }

    const reservacion = doc.data();

    if (reservacion.estado !== 'sentada') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Solo se pueden terminar reservaciones que estén sentadas',
      });
    }

    await reservacionesCollection.doc(id).update({
      estado: 'terminada',
      actualizadoEn: new Date(),
    });

    const docActualizado = await reservacionesCollection.doc(id).get();

    return res.status(200).json({
      exito: true,
      mensaje: 'Reservación marcada como terminada',
      datos: {
        id: docActualizado.id,
        ...docActualizado.data(),
      },
    });
  } catch (error) {
    console.error('Error al marcar reservación como terminada:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al marcar reservación como terminada',
      error: error.message,
    });
  }
};

/**
 * Cancelar reservación
 */
const cancelarReservacion = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await reservacionesCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Reservación no encontrada',
      });
    }

    const reservacion = doc.data();

    if (reservacion.estado === 'terminada' || reservacion.estado === 'cancelada') {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se puede cancelar una reservación terminada o ya cancelada',
      });
    }

    await reservacionesCollection.doc(id).update({
      estado: 'cancelada',
      actualizadoEn: new Date(),
    });

    const docActualizado = await reservacionesCollection.doc(id).get();

    return res.status(200).json({
      exito: true,
      mensaje: 'Reservación cancelada exitosamente',
      datos: {
        id: docActualizado.id,
        ...docActualizado.data(),
      },
    });
  } catch (error) {
    console.error('Error al cancelar reservación:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al cancelar reservación',
      error: error.message,
    });
  }
};

module.exports = {
  crearReservacion,
  obtenerReservaciones,
  obtenerReservacionPorId,
  actualizarReservacion,
  marcarComoSentada,
  marcarComoTerminada,
  cancelarReservacion,
};
