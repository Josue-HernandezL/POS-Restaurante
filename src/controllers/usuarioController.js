const { db } = require('../config/firebase');
const Usuario = require('../models/Usuario');
const Autorizacion = require('../models/Autorizacion');

/**
 * Crea un nuevo usuario en el sistema
 * @route POST /api/usuarios
 */
const crearUsuario = async (req, res) => {
  try {
    const { nombre, correo, rol, pinSeguridad, activo } = req.body;

    // Validar formato del PIN
    if (!Usuario.validarFormatoPin(pinSeguridad)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El PIN debe tener entre 4 y 6 dígitos'
      });
    }

    // Verificar si el correo ya existe
    const usuariosRef = db.collection('usuarios');
    const usuarioExistente = await usuariosRef
      .where('correo', '==', correo)
      .limit(1)
      .get();

    if (!usuarioExistente.empty) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese correo electrónico'
      });
    }

    // Hashear el PIN
    const pinHasheado = await Usuario.hashearPin(pinSeguridad);

    // Crear el usuario
    const usuario = new Usuario({
      nombre,
      correo,
      rol,
      pinSeguridad: pinHasheado,
      activo: activo !== undefined ? activo : true
    });

    // Validar datos del usuario
    const validacion = usuario.validar();
    if (!validacion.valido) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Datos inválidos',
        errores: validacion.errores
      });
    }

    // Guardar en Firestore
    const usuarioData = usuario.toFirestore();
    const docRef = await usuariosRef.add(usuarioData);

    // Registrar autorización
    const autorizacion = new Autorizacion({
      accion: Autorizacion.ACCIONES.CREAR_USUARIO,
      modulo: Autorizacion.MODULOS.USUARIOS,
      usuarioId: req.usuario.uid,
      usuarioNombre: req.usuario.correoElectronico || req.usuario.email,
      usuarioRol: req.usuario.rol || 'dueno',
      detalles: {
        usuarioCreado: {
          id: docRef.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol
        }
      },
      ipAddress: req.ip,
      resultado: Autorizacion.RESULTADOS.EXITOSO
    });

    await db.collection('autorizaciones').add(autorizacion.toFirestore());

    // Retornar usuario creado
    usuario.id = docRef.id;
    res.status(201).json({
      exito: true,
      mensaje: 'Usuario creado exitosamente',
      datos: usuario.toJSON()
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear usuario',
      error: error.message
    });
  }
};

/**
 * Obtiene todos los usuarios del sistema
 * @route GET /api/usuarios
 */
const obtenerUsuarios = async (req, res) => {
  try {
    const { activo, rol } = req.query;

    let query = db.collection('usuarios');

    // Aplicar filtros si existen
    if (activo !== undefined) {
      const activoBool = activo === 'true';
      query = query.where('activo', '==', activoBool);
    }

    if (rol) {
      query = query.where('rol', '==', rol);
    }

    // Ordenar por fecha de creación descendente
    query = query.orderBy('creadoEn', 'desc');

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.json({
        exito: true,
        datos: [],
        total: 0
      });
    }

    const usuarios = [];
    snapshot.forEach(doc => {
      const usuario = new Usuario({ id: doc.id, ...doc.data() });
      usuarios.push(usuario.toJSON());
    });

    res.json({
      exito: true,
      datos: usuarios,
      total: usuarios.length
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * Obtiene un usuario específico por ID
 * @route GET /api/usuarios/:id
 */
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('usuarios').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    const usuario = new Usuario({ id: doc.id, ...doc.data() });

    res.json({
      exito: true,
      datos: usuario.toJSON()
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * Actualiza un usuario existente
 * @route PUT /api/usuarios/:id
 */
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, rol, pinSeguridad, activo } = req.body;

    // Verificar que el usuario existe
    const docRef = db.collection('usuarios').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    const datosActuales = doc.data();
    const actualizaciones = {
      actualizadoEn: new Date().toISOString()
    };

    // Actualizar campos si se proporcionan
    if (nombre !== undefined) actualizaciones.nombre = nombre;
    if (correo !== undefined) {
      // Verificar si el nuevo correo ya existe (excepto el usuario actual)
      const usuariosRef = db.collection('usuarios');
      const correoExistente = await usuariosRef
        .where('correo', '==', correo)
        .limit(1)
        .get();

      if (!correoExistente.empty && correoExistente.docs[0].id !== id) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Ya existe otro usuario con ese correo electrónico'
        });
      }
      actualizaciones.correo = correo;
    }
    if (rol !== undefined) {
      if (!Usuario.validarRol(rol)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Rol inválido'
        });
      }
      actualizaciones.rol = rol;
    }
    if (activo !== undefined) actualizaciones.activo = activo;

    // Si se proporciona un nuevo PIN, hashearlo
    if (pinSeguridad) {
      if (!Usuario.validarFormatoPin(pinSeguridad)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El PIN debe tener entre 4 y 6 dígitos'
        });
      }
      actualizaciones.pinSeguridad = await Usuario.hashearPin(pinSeguridad);
    }

    // Actualizar en Firestore
    await docRef.update(actualizaciones);

    // Registrar autorización
    const autorizacion = new Autorizacion({
      accion: Autorizacion.ACCIONES.ACTUALIZAR_USUARIO,
      modulo: Autorizacion.MODULOS.USUARIOS,
        usuarioId: req.usuario.uid,
        usuarioNombre: req.usuario.correoElectronico || req.usuario.email,
        usuarioRol: req.usuario.rol || 'dueno',
      detalles: {
        usuarioActualizado: {
          id,
          camposModificados: Object.keys(actualizaciones).filter(k => k !== 'actualizadoEn'),
          valoresAnteriores: Object.keys(actualizaciones).reduce((acc, key) => {
            if (key !== 'actualizadoEn' && key !== 'pinSeguridad') {
              acc[key] = datosActuales[key];
            }
            return acc;
          }, {})
        }
      },
      ipAddress: req.ip,
      resultado: Autorizacion.RESULTADOS.EXITOSO
    });

    await db.collection('autorizaciones').add(autorizacion.toFirestore());

    // Obtener usuario actualizado
    const usuarioActualizado = await docRef.get();
    const usuario = new Usuario({ id: usuarioActualizado.id, ...usuarioActualizado.data() });

    res.json({
      exito: true,
      mensaje: 'Usuario actualizado exitosamente',
      datos: usuario.toJSON()
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * Elimina un usuario del sistema
 * @route DELETE /api/usuarios/:id
 */
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const docRef = db.collection('usuarios').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    const datosUsuario = doc.data();

    // No permitir que un usuario se elimine a sí mismo
    if (req.usuario.uid === id) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No puedes eliminar tu propio usuario'
      });
    }

    // Eliminar el usuario
    await docRef.delete();

    // Registrar autorización
    const autorizacion = new Autorizacion({
      accion: Autorizacion.ACCIONES.ELIMINAR_USUARIO,
      modulo: Autorizacion.MODULOS.USUARIOS,
      usuarioId: req.usuario.uid,
      usuarioNombre: req.usuario.correoElectronico || req.usuario.email,
      usuarioRol: req.usuario.rol || 'dueno',
      detalles: {
        usuarioEliminado: {
          id,
          nombre: datosUsuario.nombre,
          correo: datosUsuario.correo,
          rol: datosUsuario.rol
        }
      },
      ipAddress: req.ip,
      resultado: Autorizacion.RESULTADOS.EXITOSO
    });

    await db.collection('autorizaciones').add(autorizacion.toFirestore());

    res.json({
      exito: true,
      mensaje: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

/**
 * Verifica el PIN de seguridad de un usuario
 * @route POST /api/usuarios/:id/verificar-pin
 */
const verificarPin = async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El PIN es requerido'
      });
    }

    // Obtener usuario
    const doc = await db.collection('usuarios').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    const datosUsuario = doc.data();

    // Verificar PIN
    const pinValido = await Usuario.compararPin(pin, datosUsuario.pinSeguridad);

    if (!pinValido) {
      // Registrar intento fallido
      const autorizacion = new Autorizacion({
        accion: Autorizacion.ACCIONES.INTENTO_ACCESO_DENEGADO,
        modulo: Autorizacion.MODULOS.AUTENTICACION,
        usuarioId: id,
        usuarioNombre: datosUsuario.nombre,
        usuarioRol: datosUsuario.rol,
        detalles: {
          motivo: 'PIN incorrecto'
        },
        ipAddress: req.ip,
        resultado: Autorizacion.RESULTADOS.FALLIDO
      });

      await db.collection('autorizaciones').add(autorizacion.toFirestore());

      return res.status(401).json({
        exito: false,
        mensaje: 'PIN incorrecto'
      });
    }

    res.json({
      exito: true,
      mensaje: 'PIN verificado correctamente',
      datos: {
        usuarioId: id,
        nombre: datosUsuario.nombre,
        rol: datosUsuario.rol
      }
    });

  } catch (error) {
    console.error('Error al verificar PIN:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar PIN',
      error: error.message
    });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  verificarPin
};
