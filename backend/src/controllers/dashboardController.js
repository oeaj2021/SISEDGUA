const { Reporte, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const { desde, hasta, turno, municipio } = req.query;
    const where = {};

    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    } else if (desde) {
      where.fecha = { [Op.gte]: desde };
    } else if (hasta) {
      where.fecha = { [Op.lte]: hasta };
    }

    if (turno && ['MAÑANA', 'TARDE'].includes(turno)) {
      where.turno = turno;
    }

    if (municipio) {
      where.municipio = { [Op.contains]: [municipio.toUpperCase()] };
    }

    const stats = await Reporte.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_reportes'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('matricula_asistente')), 0), 'estudiantes_asistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('matricula_inasistente')), 0), 'estudiantes_inasistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('docentes_asistente')), 0), 'docentes_asistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('docentes_inasistente')), 0), 'docentes_inasistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('admin_asistente')), 0), 'admin_asistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('admin_inasistente')), 0), 'admin_inasistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('obrero_asistente')), 0), 'obrero_asistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('obrero_inasistente')), 0), 'obrero_inasistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('cocina_asistente')), 0), 'cocina_asistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('cocina_inasistente')), 0), 'cocina_inasistente']
      ],
      raw: true
    });

    const total_reportes = parseInt(stats?.total_reportes || 0, 10);
    const estudiantes_asistente = parseInt(stats?.estudiantes_asistente || 0, 10);
    const estudiantes_inasistente = parseInt(stats?.estudiantes_inasistente || 0, 10);
    const total_matricula = estudiantes_asistente + estudiantes_inasistente;

    const pct_asistencia = total_matricula > 0
      ? ((estudiantes_asistente / total_matricula) * 100).toFixed(2)
      : '0.00';

    return res.json({
      total_reportes,
      estudiantes_asistente,
      estudiantes_inasistente,
      pct_asistencia,
      docentes_asistente: parseInt(stats?.docentes_asistente || 0, 10),
      docentes_inasistente: parseInt(stats?.docentes_inasistente || 0, 10),
      admin_asistente: parseInt(stats?.admin_asistente || 0, 10),
      admin_inasistente: parseInt(stats?.admin_inasistente || 0, 10),
      obrero_asistente: parseInt(stats?.obrero_asistente || 0, 10),
      obrero_inasistente: parseInt(stats?.obrero_inasistente || 0, 10),
      cocina_asistente: parseInt(stats?.cocina_asistente || 0, 10),
      cocina_inasistente: parseInt(stats?.cocina_inasistente || 0, 10)
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
};

exports.getPorMunicipio = async (req, res) => {
  try {
    const { desde, hasta, turno } = req.query;
    const whereConditions = [];
    const replacements = {};

    if (desde && hasta) {
      whereConditions.push('fecha BETWEEN :desde AND :hasta');
      replacements.desde = desde;
      replacements.hasta = hasta;
    } else if (desde) {
      whereConditions.push('fecha >= :desde');
      replacements.desde = desde;
    } else if (hasta) {
      whereConditions.push('fecha <= :hasta');
      replacements.hasta = hasta;
    }

    if (turno && ['MAÑANA', 'TARDE'].includes(turno)) {
      whereConditions.push('turno = :turno');
      replacements.turno = turno;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        mun AS municipio,
        COUNT(*)::INTEGER AS reportes,
        COALESCE(SUM(matricula_asistente), 0)::INTEGER AS matricula_asistente,
        COALESCE(SUM(matricula_inasistente), 0)::INTEGER AS matricula_inasistente,
        COALESCE(SUM(docentes_asistente), 0)::INTEGER AS docentes_asistente,
        COALESCE(SUM(docentes_inasistente), 0)::INTEGER AS docentes_inasistente
      FROM reportes,
      UNNEST(municipio) AS mun
      ${whereClause}
      GROUP BY mun
      ORDER BY mun ASC;
    `;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return res.json(results);
  } catch (error) {
    console.error('Error en desglose por municipio:', error);
    return res.status(500).json({ error: 'Error al calcular datos por municipio' });
  }
};

exports.getTendencia = async (req, res) => {
  try {
    const { desde, hasta, turno, municipio } = req.query;
    const where = {};

    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    } else if (desde) {
      where.fecha = { [Op.gte]: desde };
    } else if (hasta) {
      where.fecha = { [Op.lte]: hasta };
    }

    if (turno && ['MAÑANA', 'TARDE'].includes(turno)) {
      where.turno = turno;
    }
    if (municipio) {
      where.municipio = { [Op.contains]: [municipio.toUpperCase()] };
    }

    const reportes = await Reporte.findAll({
      where,
      attributes: [
        'fecha',
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('matricula_asistente')), 0), 'asistente'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('matricula_inasistente')), 0), 'inasistente'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'reportes']
      ],
      group: ['fecha'],
      order: [['fecha', 'ASC']],
      raw: true
    });

    const formatted = reportes.map(r => ({
      fecha: r.fecha,
      asistente: parseInt(r.asistente || 0, 10),
      inasistente: parseInt(r.inasistente || 0, 10),
      reportes: parseInt(r.reportes || 0, 10)
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error en cálculo de tendencia:', error);
    return res.status(500).json({ error: 'Error al calcular tendencia temporal' });
  }
};

exports.getReportes = async (req, res) => {
  try {
    const { municipio, fecha, turno, page = 1, limit = 20 } = req.query;
    const where = {};

    if (municipio) {
      where.municipio = { [Op.contains]: [municipio.toUpperCase()] };
    }
    if (fecha) {
      where.fecha = fecha;
    }
    if (turno && ['MAÑANA', 'TARDE'].includes(turno)) {
      where.turno = turno;
    }

    const limitNum = parseInt(limit, 10) || 20;
    const pageNum = parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Reporte.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.json({
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
      data: rows
    });
  } catch (error) {
    console.error('Error en listado de reportes:', error);
    return res.status(500).json({ error: 'Error al consultar registros de reportes' });
  }
};
