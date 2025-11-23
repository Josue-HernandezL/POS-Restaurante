const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const Usuario = require('../models/Usuario');

// Colección de usuarios en Firestore
const usuariosCollection = db.collection('usuarios');

/**
 * Registrar un nuevo usuario
 */
const registrar = async (req, res) => {
  try {
    const { nombreCompleto, correoElectronico, rol, contrasena } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombreCompleto || !correoElectronico || !rol || !contrasena) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos son requeridos',
      });
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoElectronico)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Formato de correo electrónico inválido',
      });
    }

    // Validar que el rol sea válido
    if (!Usuario.validarRol(rol)) {
      return res.status(400).json({
        exito: false,
        mensaje: `Rol inválido. Los roles válidos son: ${Usuario.obtenerRoles().join(', ')}`,
      });
    }

    // Validar longitud de contraseña
    if (contrasena.length < 6) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    // Verificar si el correo ya está registrado
    const usuarioExistente = await usuariosCollection
      .where('correoElectronico', '==', correoElectronico)
      .get();

    if (!usuarioExistente.empty) {
      return res.status(409).json({
        exito: false,
        mensaje: 'El correo electrónico ya está registrado',
      });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombreCompleto,
      correoElectronico: correoElectronico.toLowerCase(),
      rol,
      contrasenaHash,
      pinSeguridad: null
    });

    // Guardar en Firestore
    const docRef = await usuariosCollection.add(nuevoUsuario.toFirestore());

    // Generar token JWT
    const token = jwt.sign(
      {
        uid: docRef.id,
        correoElectronico: nuevoUsuario.correoElectronico,
        rol: nuevoUsuario.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado exitosamente',
      datos: {
        uid: docRef.id,
        ...nuevoUsuario.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al registrar usuario',
      error: error.message,
    });
  }
};

/**
 * Iniciar sesión
 */
const iniciarSesion = async (req, res) => {
  try {
    const { correoElectronico, contrasena } = req.body;

    // Validar que todos los campos estén presentes
    if (!correoElectronico || !contrasena) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Correo electrónico y contraseña son requeridos',
      });
    }

    // Buscar usuario por correo electrónico
    const usuariosSnapshot = await usuariosCollection
      .where('correoElectronico', '==', correoElectronico.toLowerCase())
      .limit(1)
      .get();

    if (usuariosSnapshot.empty) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas',
      });
    }

    const usuarioDoc = usuariosSnapshot.docs[0];
    const usuarioData = usuarioDoc.data();

    // Verificar si el usuario está activo
    if (!usuarioData.activo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Usuario inactivo. Contacta al administrador',
      });
    }

    // Verificar contraseña
    const contrasenaValida = await bcrypt.compare(contrasena, usuarioData.contrasenaHash);

    if (!contrasenaValida) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas',
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        uid: usuarioDoc.id,
        correoElectronico: usuarioData.correoElectronico,
        rol: usuarioData.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    return res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      datos: {
        uid: usuarioDoc.id,
        nombreCompleto: usuarioData.nombreCompleto,
        correoElectronico: usuarioData.correoElectronico,
        rol: usuarioData.rol,
        token,
      },
    });
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al iniciar sesión',
      error: error.message,
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
const obtenerPerfil = async (req, res) => {
  try {
    const { uid } = req.usuario;

    const usuarioDoc = await usuariosCollection.doc(uid).get();

    if (!usuarioDoc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    const usuarioData = usuarioDoc.data();
    const usuario = new Usuario(usuarioData);

    return res.status(200).json({
      exito: true,
      datos: {
        uid: usuarioDoc.id,
        ...usuario.toJSON(),
      },
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener perfil',
      error: error.message,
    });
  }
};

module.exports = {
  registrar,
  iniciarSesion,
  obtenerPerfil,
};
