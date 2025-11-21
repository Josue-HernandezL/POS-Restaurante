const Dashboard = require('../models/Dashboard');

/**
 * Obtener métricas principales del dashboard
 */
const obtenerMetricasPrincipales = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let fechaInicioDate = null;
    let fechaFinDate = null;

    if (fechaInicio) {
      fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({
          error: 'Formato de fechaInicio inválido. Use formato ISO 8601'
        });
      }
    }

    if (fechaFin) {
      fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({
          error: 'Formato de fechaFin inválido. Use formato ISO 8601'
        });
      }
    }

    const metricas = await Dashboard.obtenerMetricasPrincipales(fechaInicioDate, fechaFinDate);

    res.status(200).json({
      metricas
    });
  } catch (error) {
    console.error('Error al obtener métricas principales:', error);
    res.status(500).json({
      error: 'Error al obtener métricas principales',
      detalles: error.message
    });
  }
};

/**
 * Obtener ventas por categoría
 */
const obtenerVentasPorCategoria = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let fechaInicioDate = null;
    let fechaFinDate = null;

    if (fechaInicio) {
      fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({
          error: 'Formato de fechaInicio inválido. Use formato ISO 8601'
        });
      }
    }

    if (fechaFin) {
      fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({
          error: 'Formato de fechaFin inválido. Use formato ISO 8601'
        });
      }
    }

    const ventas = await Dashboard.obtenerVentasPorCategoria(fechaInicioDate, fechaFinDate);

    res.status(200).json({
      ventasPorCategoria: ventas,
      total: ventas.length
    });
  } catch (error) {
    console.error('Error al obtener ventas por categoría:', error);
    res.status(500).json({
      error: 'Error al obtener ventas por categoría',
      detalles: error.message
    });
  }
};

/**
 * Obtener productos más vendidos
 */
const obtenerProductosMasVendidos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, limite } = req.query;

    let fechaInicioDate = null;
    let fechaFinDate = null;
    let limiteNum = parseInt(limite) || 5;

    if (limiteNum < 1 || limiteNum > 50) {
      return res.status(400).json({
        error: 'El límite debe estar entre 1 y 50'
      });
    }

    if (fechaInicio) {
      fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({
          error: 'Formato de fechaInicio inválido. Use formato ISO 8601'
        });
      }
    }

    if (fechaFin) {
      fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({
          error: 'Formato de fechaFin inválido. Use formato ISO 8601'
        });
      }
    }

    const productos = await Dashboard.obtenerProductosMasVendidos(fechaInicioDate, fechaFinDate, limiteNum);

    res.status(200).json({
      productosMasVendidos: productos,
      total: productos.length
    });
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    res.status(500).json({
      error: 'Error al obtener productos más vendidos',
      detalles: error.message
    });
  }
};

/**
 * Obtener órdenes recientes
 */
const obtenerOrdenesRecientes = async (req, res) => {
  try {
    const { limite } = req.query;
    const limiteNum = parseInt(limite) || 10;

    if (limiteNum < 1 || limiteNum > 50) {
      return res.status(400).json({
        error: 'El límite debe estar entre 1 y 50'
      });
    }

    const ordenes = await Dashboard.obtenerOrdenesRecientes(limiteNum);

    res.status(200).json({
      ordenesRecientes: ordenes,
      total: ordenes.length
    });
  } catch (error) {
    console.error('Error al obtener órdenes recientes:', error);
    res.status(500).json({
      error: 'Error al obtener órdenes recientes',
      detalles: error.message
    });
  }
};

/**
 * Obtener resumen completo del dashboard
 */
const obtenerResumenCompleto = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let fechaInicioDate = null;
    let fechaFinDate = null;

    if (fechaInicio) {
      fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({
          error: 'Formato de fechaInicio inválido. Use formato ISO 8601'
        });
      }
    }

    if (fechaFin) {
      fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({
          error: 'Formato de fechaFin inválido. Use formato ISO 8601'
        });
      }
    }

    const resumen = await Dashboard.obtenerResumenCompleto(fechaInicioDate, fechaFinDate);

    res.status(200).json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen completo:', error);
    res.status(500).json({
      error: 'Error al obtener resumen completo del dashboard',
      detalles: error.message
    });
  }
};

/**
 * Obtener total de items en el menú
 */
const obtenerTotalItemsMenu = async (req, res) => {
  try {
    const total = await Dashboard.obtenerTotalItemsMenu();

    res.status(200).json({
      itemsEnMenu: total
    });
  } catch (error) {
    console.error('Error al obtener total de items del menú:', error);
    res.status(500).json({
      error: 'Error al obtener total de items del menú',
      detalles: error.message
    });
  }
};

module.exports = {
  obtenerMetricasPrincipales,
  obtenerVentasPorCategoria,
  obtenerProductosMasVendidos,
  obtenerOrdenesRecientes,
  obtenerResumenCompleto,
  obtenerTotalItemsMenu
};
