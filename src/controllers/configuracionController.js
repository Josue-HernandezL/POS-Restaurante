const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const Configuracion = require('../models/Configuracion');

// ID fijo para el documento de configuración (solo habrá uno)
const CONFIGURACION_ID = 'config_general';

/**
 * Obtener la configuración actual del restaurante
 */
const obtenerConfiguracion = async (req, res) => {
  try {
    const docRef = db.collection('configuracion').doc(CONFIGURACION_ID);
    const doc = await docRef.get();

    if (!doc.exists) {
      // Si no existe configuración, crear una con valores por defecto
      const configuracionDefault = new Configuracion();
      await docRef.set({
        ...configuracionDefault.toFirestore(),
        creadoEn: new Date().toISOString()
      });

      return res.status(200).json({
        exito: true,
        mensaje: 'Configuración inicializada con valores por defecto',
        datos: configuracionDefault.toJSON()
      });
    }

    const configuracion = Configuracion.fromFirestore(doc.data());

    res.status(200).json({
      exito: true,
      datos: configuracion.toJSON()
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener la configuración',
      error: error.message
    });
  }
};

/**
 * Actualizar información del restaurante
 */
const actualizarRestaurante = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    const { nombre, direccion, telefono, numeroMesas } = req.body;

    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'dueno' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para modificar la configuración del restaurante'
      });
    }

    const docRef = db.collection('configuracion').doc(CONFIGURACION_ID);
    const doc = await docRef.get();

    let configuracion;
    if (!doc.exists) {
      configuracion = new Configuracion();
    } else {
      configuracion = Configuracion.fromFirestore(doc.data());
    }

    // Actualizar solo los campos proporcionados
    if (nombre !== undefined) configuracion.restaurante.nombre = nombre;
    if (direccion !== undefined) configuracion.restaurante.direccion = direccion;
    if (telefono !== undefined) configuracion.restaurante.telefono = telefono;
    if (numeroMesas !== undefined) configuracion.restaurante.numeroMesas = numeroMesas;

    // Validar la información del restaurante
    const erroresValidacion = configuracion.validarRestaurante();
    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: erroresValidacion
      });
    }

    // Guardar en Firestore
    await docRef.set(configuracion.toFirestore(), { merge: true });

    res.status(200).json({
      exito: true,
      mensaje: 'Información del restaurante actualizada exitosamente',
      datos: configuracion.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar información del restaurante:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar la información del restaurante',
      error: error.message
    });
  }
};

/**
 * Actualizar configuración de notificaciones
 */
const actualizarNotificaciones = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    const { nuevasOrdenes, nuevasReservaciones } = req.body;

    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'dueno' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para modificar las notificaciones'
      });
    }

    const docRef = db.collection('configuracion').doc(CONFIGURACION_ID);
    const doc = await docRef.get();

    let configuracion;
    if (!doc.exists) {
      configuracion = new Configuracion();
    } else {
      configuracion = Configuracion.fromFirestore(doc.data());
    }

    // Actualizar solo los campos proporcionados
    if (nuevasOrdenes !== undefined) configuracion.notificaciones.nuevasOrdenes = nuevasOrdenes;
    if (nuevasReservaciones !== undefined) configuracion.notificaciones.nuevasReservaciones = nuevasReservaciones;

    // Validar notificaciones
    const erroresValidacion = configuracion.validarNotificaciones();
    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: erroresValidacion
      });
    }

    // Guardar en Firestore
    await docRef.set(configuracion.toFirestore(), { merge: true });

    res.status(200).json({
      exito: true,
      mensaje: 'Configuración de notificaciones actualizada exitosamente',
      datos: configuracion.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar notificaciones:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar la configuración de notificaciones',
      error: error.message
    });
  }
};

/**
 * Actualizar configuración de impuestos
 */
const actualizarImpuestos = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    const { porcentajeIVA, aplicarATodos } = req.body;

    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'dueno' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para modificar la configuración de impuestos'
      });
    }

    const docRef = db.collection('configuracion').doc(CONFIGURACION_ID);
    const doc = await docRef.get();

    let configuracion;
    if (!doc.exists) {
      configuracion = new Configuracion();
    } else {
      configuracion = Configuracion.fromFirestore(doc.data());
    }

    // Actualizar solo los campos proporcionados
    if (porcentajeIVA !== undefined) configuracion.impuestos.porcentajeIVA = porcentajeIVA;
    if (aplicarATodos !== undefined) configuracion.impuestos.aplicarATodos = aplicarATodos;

    // Validar impuestos
    const erroresValidacion = configuracion.validarImpuestos();
    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: erroresValidacion
      });
    }

    // Guardar en Firestore
    await docRef.set(configuracion.toFirestore(), { merge: true });

    res.status(200).json({
      exito: true,
      mensaje: 'Configuración de impuestos actualizada exitosamente',
      datos: configuracion.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar impuestos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar la configuración de impuestos',
      error: error.message
    });
  }
};

/**
 * Actualizar opciones de propina
 */
const actualizarPropinas = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        errores: errores.array()
      });
    }

    const { opcion1, opcion2, opcion3, permitirPersonalizada } = req.body;

    // Verificar que el usuario sea admin o gerente
    if (req.usuario.rol !== 'dueno' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para modificar las opciones de propina'
      });
    }

    const docRef = db.collection('configuracion').doc(CONFIGURACION_ID);
    const doc = await docRef.get();

    let configuracion;
    if (!doc.exists) {
      configuracion = new Configuracion();
    } else {
      configuracion = Configuracion.fromFirestore(doc.data());
    }

    // Actualizar solo los campos proporcionados
    if (opcion1 !== undefined) configuracion.propinas.opcion1 = opcion1;
    if (opcion2 !== undefined) configuracion.propinas.opcion2 = opcion2;
    if (opcion3 !== undefined) configuracion.propinas.opcion3 = opcion3;
    if (permitirPersonalizada !== undefined) configuracion.propinas.permitirPersonalizada = permitirPersonalizada;

    // Validar propinas
    const erroresValidacion = configuracion.validarPropinas();
    if (erroresValidacion.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: erroresValidacion
      });
    }

    // Guardar en Firestore
    await docRef.set(configuracion.toFirestore(), { merge: true });

    res.status(200).json({
      exito: true,
      mensaje: 'Opciones de propina actualizadas exitosamente',
      datos: configuracion.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar propinas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar las opciones de propina',
      error: error.message
    });
  }
};

module.exports = {
  obtenerConfiguracion,
  actualizarRestaurante,
  actualizarNotificaciones,
  actualizarImpuestos,
  actualizarPropinas
};
