const { db } = require('../config/firebase');

/**
 * Modelo Dashboard
 * Gestiona el cálculo de estadísticas y métricas del sistema
 */
class Dashboard {
  /**
   * Obtener métricas principales del dashboard
   * @param {Date} fechaInicio - Fecha inicial del período
   * @param {Date} fechaFin - Fecha final del período
   * @returns {Object} - Métricas principales
   */
  static async obtenerMetricasPrincipales(fechaInicio = null, fechaFin = null) {
    try {
      const ahora = new Date();
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      
      // Si no se especifican fechas, usar el día actual
      const fechaInicioFiltro = fechaInicio || inicioHoy;
      const fechaFinFiltro = fechaFin || ahora;

      // Obtener todas las órdenes del período
      let ordenesQuery = db.collection('ordenes');
      
      if (fechaInicioFiltro) {
        ordenesQuery = ordenesQuery.where('creadoEn', '>=', fechaInicioFiltro);
      }
      if (fechaFinFiltro) {
        ordenesQuery = ordenesQuery.where('creadoEn', '<=', fechaFinFiltro);
      }

      const ordenesSnapshot = await ordenesQuery.get();
      const ordenes = ordenesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Obtener pagos del período
      let pagosQuery = db.collection('pagos');
      
      if (fechaInicioFiltro) {
        pagosQuery = pagosQuery.where('fechaPago', '>=', fechaInicioFiltro);
      }
      if (fechaFinFiltro) {
        pagosQuery = pagosQuery.where('fechaPago', '<=', fechaFinFiltro);
      }

      const pagosSnapshot = await pagosQuery.get();
      const pagos = pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calcular ingresos totales (pagos completados)
      const pagosCompletados = pagos.filter(p => p.estado === 'completado');
      const ingresosTotales = pagosCompletados.reduce((sum, pago) => sum + (pago.total || 0), 0);
      
      // Calcular propinas totales
      const propinaTotales = pagosCompletados.reduce((sum, pago) => sum + (pago.propina || 0), 0);

      // Total de órdenes completadas
      const ordenesCompletadas = ordenes.filter(o => o.estado === 'completado');
      const totalOrdenes = ordenesCompletadas.length;

      // Ticket promedio
      const ticketPromedio = totalOrdenes > 0 ? ingresosTotales / totalOrdenes : 0;

      // Propina promedio
      const propinaPromedio = totalOrdenes > 0 ? propinaTotales / totalOrdenes : 0;
      const propinaPorcentaje = ingresosTotales > 0 ? (propinaTotales / ingresosTotales) * 100 : 0;

      // Obtener reservaciones confirmadas del período
      let reservacionesQuery = db.collection('reservaciones');
      
      if (fechaInicioFiltro) {
        reservacionesQuery = reservacionesQuery.where('fechaHora', '>=', fechaInicioFiltro);
      }
      if (fechaFinFiltro) {
        reservacionesQuery = reservacionesQuery.where('fechaHora', '<=', fechaFinFiltro);
      }

      const reservacionesSnapshot = await reservacionesQuery.get();
      const reservacionesConfirmadas = reservacionesSnapshot.docs.filter(
        doc => doc.data().estado === 'confirmada'
      ).length;

      // Órdenes por estado
      const ordenesPendientes = ordenes.filter(o => o.estado === 'pendiente').length;
      const ordenesEnPreparacion = ordenes.filter(o => o.estado === 'en_preparacion').length;

      // Comparación con mes anterior
      const mesAnteriorInicio = new Date(fechaInicioFiltro);
      mesAnteriorInicio.setMonth(mesAnteriorInicio.getMonth() - 1);
      const mesAnteriorFin = new Date(fechaFinFiltro);
      mesAnteriorFin.setMonth(mesAnteriorFin.getMonth() - 1);

      const pagosAnteriorSnapshot = await db.collection('pagos')
        .where('fechaPago', '>=', mesAnteriorInicio)
        .where('fechaPago', '<=', mesAnteriorFin)
        .where('estado', '==', 'completado')
        .get();

      const ingresosMesAnterior = pagosAnteriorSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().total || 0), 0
      );

      const porcentajeCambio = ingresosMesAnterior > 0 
        ? ((ingresosTotales - ingresosMesAnterior) / ingresosMesAnterior) * 100 
        : 0;

      return {
        ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
        porcentajeCambioIngresos: parseFloat(porcentajeCambio.toFixed(2)),
        totalOrdenes,
        ordenesCompletadas: totalOrdenes,
        ticketPromedio: parseFloat(ticketPromedio.toFixed(2)),
        reservaciones: reservacionesConfirmadas,
        ordenesPendientes,
        ordenesEnPreparacion,
        propinaPromedio: parseFloat(propinaPromedio.toFixed(2)),
        propinaPorcentaje: parseFloat(propinaPorcentaje.toFixed(2)),
        periodo: {
          inicio: fechaInicioFiltro.toISOString(),
          fin: fechaFinFiltro.toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener métricas principales: ${error.message}`);
    }
  }

  /**
   * Obtener ventas por categoría
   * @param {Date} fechaInicio - Fecha inicial del período
   * @param {Date} fechaFin - Fecha final del período
   * @returns {Array} - Ventas agrupadas por categoría
   */
  static async obtenerVentasPorCategoria(fechaInicio = null, fechaFin = null) {
    try {
      const ahora = new Date();
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      
      const fechaInicioFiltro = fechaInicio || inicioHoy;
      const fechaFinFiltro = fechaFin || ahora;

      // Obtener órdenes completadas del período
      let ordenesQuery = db.collection('ordenes')
        .where('estado', '==', 'completado');
      
      if (fechaInicioFiltro) {
        ordenesQuery = ordenesQuery.where('creadoEn', '>=', fechaInicioFiltro);
      }
      if (fechaFinFiltro) {
        ordenesQuery = ordenesQuery.where('creadoEn', '<=', fechaFinFiltro);
      }

      const ordenesSnapshot = await ordenesQuery.get();
      const ordenes = ordenesSnapshot.docs.map(doc => doc.data());

      // Obtener categorías
      const categoriasSnapshot = await db.collection('categorias').get();
      const categorias = {};
      categoriasSnapshot.docs.forEach(doc => {
        categorias[doc.id] = { ...doc.data(), id: doc.id };
      });

      // Obtener items del menú para mapear categorías
      const itemsSnapshot = await db.collection('items').get();
      const items = {};
      itemsSnapshot.docs.forEach(doc => {
        items[doc.id] = { ...doc.data(), id: doc.id };
      });

      // Agrupar ventas por categoría
      const ventasPorCategoria = {};

      ordenes.forEach(orden => {
        if (orden.items && Array.isArray(orden.items)) {
          orden.items.forEach(itemPedido => {
            const item = items[itemPedido.itemId];
            if (item && item.categoriaId) {
              const categoria = categorias[item.categoriaId];
              const categoriaNombre = categoria ? categoria.nombre : 'Sin Categoría';
              const categoriaId = item.categoriaId;

              if (!ventasPorCategoria[categoriaId]) {
                ventasPorCategoria[categoriaId] = {
                  categoria: categoriaNombre,
                  total: 0,
                  cantidad: 0,
                  porcentaje: 0
                };
              }

              const precioTotal = (itemPedido.precio || 0) * (itemPedido.cantidad || 0);
              ventasPorCategoria[categoriaId].total += precioTotal;
              ventasPorCategoria[categoriaId].cantidad += itemPedido.cantidad || 0;
            }
          });
        }
      });

      // Calcular total general y porcentajes
      const totalGeneral = Object.values(ventasPorCategoria).reduce(
        (sum, cat) => sum + cat.total, 0
      );

      const resultado = Object.values(ventasPorCategoria).map(cat => ({
        ...cat,
        total: parseFloat(cat.total.toFixed(2)),
        porcentaje: totalGeneral > 0 ? parseFloat(((cat.total / totalGeneral) * 100).toFixed(2)) : 0
      }));

      // Ordenar por total descendente
      resultado.sort((a, b) => b.total - a.total);

      return resultado;
    } catch (error) {
      throw new Error(`Error al obtener ventas por categoría: ${error.message}`);
    }
  }

  /**
   * Obtener productos más vendidos
   * @param {Date} fechaInicio - Fecha inicial del período
   * @param {Date} fechaFin - Fecha final del período
   * @param {Number} limite - Cantidad de productos a retornar
   * @returns {Array} - Top productos más vendidos
   */
  static async obtenerProductosMasVendidos(fechaInicio = null, fechaFin = null, limite = 5) {
    try {
      const ahora = new Date();
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      
      const fechaInicioFiltro = fechaInicio || inicioHoy;
      const fechaFinFiltro = fechaFin || ahora;

      // Obtener órdenes completadas del período
      let ordenesQuery = db.collection('ordenes')
        .where('estado', '==', 'completado');
      
      if (fechaInicioFiltro) {
        ordenesQuery = ordenesQuery.where('creadoEn', '>=', fechaInicioFiltro);
      }
      if (fechaFinFiltro) {
        ordenesQuery = ordenesQuery.where('creadoEn', '<=', fechaFinFiltro);
      }

      const ordenesSnapshot = await ordenesQuery.get();
      const ordenes = ordenesSnapshot.docs.map(doc => doc.data());

      // Obtener items y categorías
      const itemsSnapshot = await db.collection('items').get();
      const items = {};
      itemsSnapshot.docs.forEach(doc => {
        items[doc.id] = { ...doc.data(), id: doc.id };
      });

      const categoriasSnapshot = await db.collection('categorias').get();
      const categorias = {};
      categoriasSnapshot.docs.forEach(doc => {
        categorias[doc.id] = { ...doc.data(), id: doc.id };
      });

      // Contar ventas por producto
      const ventasPorProducto = {};

      ordenes.forEach(orden => {
        if (orden.items && Array.isArray(orden.items)) {
          orden.items.forEach(itemPedido => {
            const itemId = itemPedido.itemId;
            
            if (!ventasPorProducto[itemId]) {
              const item = items[itemId];
              const categoria = item && item.categoriaId ? categorias[item.categoriaId] : null;
              
              ventasPorProducto[itemId] = {
                itemId: itemId,
                nombre: item ? item.nombre : 'Producto Desconocido',
                categoria: categoria ? categoria.nombre : 'Sin Categoría',
                cantidadVendida: 0,
                totalVentas: 0
              };
            }

            ventasPorProducto[itemId].cantidadVendida += itemPedido.cantidad || 0;
            ventasPorProducto[itemId].totalVentas += (itemPedido.precio || 0) * (itemPedido.cantidad || 0);
          });
        }
      });

      // Convertir a array y ordenar por cantidad vendida
      const resultado = Object.values(ventasPorProducto)
        .map(prod => ({
          ...prod,
          totalVentas: parseFloat(prod.totalVentas.toFixed(2))
        }))
        .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
        .slice(0, limite);

      return resultado;
    } catch (error) {
      throw new Error(`Error al obtener productos más vendidos: ${error.message}`);
    }
  }

  /**
   * Obtener órdenes recientes
   * @param {Number} limite - Cantidad de órdenes a retornar
   * @returns {Array} - Órdenes recientes
   */
  static async obtenerOrdenesRecientes(limite = 10) {
    try {
      const ordenesSnapshot = await db.collection('ordenes')
        .orderBy('creadoEn', 'desc')
        .limit(limite)
        .get();

      if (ordenesSnapshot.empty) {
        return [];
      }

      const ordenes = await Promise.all(ordenesSnapshot.docs.map(async (doc) => {
        const orden = { id: doc.id, ...doc.data() };
        
        // Obtener información de la mesa si existe
        if (orden.mesaId) {
          try {
            const mesaDoc = await db.collection('mesas').doc(orden.mesaId).get();
            if (mesaDoc.exists) {
              orden.mesaNumero = mesaDoc.data().numero;
            }
          } catch (error) {
            // Si no se puede obtener la mesa, continuar sin ella
            orden.mesaNumero = null;
          }
        }

        // Calcular total de items
        const totalItems = orden.items ? orden.items.reduce((sum, item) => sum + (item.cantidad || 0), 0) : 0;
        orden.totalItems = totalItems;

        return orden;
      }));

      return ordenes;
    } catch (error) {
      throw new Error(`Error al obtener órdenes recientes: ${error.message}`);
    }
  }

  /**
   * Obtener total de items en el menú
   * @returns {Number} - Total de items activos en el menú
   */
  static async obtenerTotalItemsMenu() {
    try {
      const itemsSnapshot = await db.collection('items')
        .where('disponible', '==', true)
        .get();

      return itemsSnapshot.size;
    } catch (error) {
      throw new Error(`Error al obtener total de items del menú: ${error.message}`);
    }
  }

  /**
   * Obtener resumen completo del dashboard
   * @param {Date} fechaInicio - Fecha inicial del período
   * @param {Date} fechaFin - Fecha final del período
   * @returns {Object} - Resumen completo con todas las métricas
   */
  static async obtenerResumenCompleto(fechaInicio = null, fechaFin = null) {
    try {
      const [
        metricasPrincipales,
        ventasPorCategoria,
        productosMasVendidos,
        ordenesRecientes,
        totalItemsMenu
      ] = await Promise.all([
        this.obtenerMetricasPrincipales(fechaInicio, fechaFin),
        this.obtenerVentasPorCategoria(fechaInicio, fechaFin),
        this.obtenerProductosMasVendidos(fechaInicio, fechaFin, 5),
        this.obtenerOrdenesRecientes(10),
        this.obtenerTotalItemsMenu()
      ]);

      return {
        metricas: {
          ...metricasPrincipales,
          itemsEnMenu: totalItemsMenu
        },
        ventasPorCategoria,
        productosMasVendidos,
        ordenesRecientes
      };
    } catch (error) {
      throw new Error(`Error al obtener resumen completo: ${error.message}`);
    }
  }
}

module.exports = Dashboard;
