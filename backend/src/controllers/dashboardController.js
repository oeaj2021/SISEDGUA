const { Reporte } = require('../models');
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

    const reportes = await Reporte.findAll({ where });

    const total_reportes = reportes.length;
    const estudiantes_asistente = reportes.reduce((acc, r) => acc + (r.matricula_asistente || 0), 0);
    const estudiantes_inasistente = reportes.reduce((acc, r) => acc + (r.matricula_inasistente || 0), 0);
    const total_matricula = estudiantes_asistente + estudiantes_inasistente;

    const pct_asistencia = total_matricula > 0
      ? ((estudiantes_asistente / total_matricula) * 100).toFixed(2)
      : '0.00';

    const docentes_asistente = reportes.reduce((acc, r) => acc + (r.docentes_asistente || 0), 0);
    const docentes_inasistente = reportes.reduce((acc, r) => acc + (r.docentes_inasistente || 0), 0);
    const admin_asistente = reportes.reduce((acc, r) => acc + (r.admin_asistente || 0), 0);
    const admin_inasistente = reportes.reduce((acc, r) => acc + (r.admin_inasistente || 0), 0);
    const obrero_asistente = reportes.reduce((acc, r) => acc + (r.obrero_asistente || 0), 0);
    const obrero_inasistente = reportes.reduce((acc, r) => acc + (r.obrero_inasistente || 0), 0);
    const cocina_asistente = reportes.reduce((acc, r) => acc + (r.cocina_asistente || 0), 0);
    const cocina_inasistente = reportes.reduce((acc, r) => acc + (r.cocina_inasistente || 0), 0);

    const personal_total_asistente = docentes_asistente + admin_asistente + obrero_asistente + cocina_asistente;
    const personal_total_inasistente = docentes_inasistente + admin_inasistente + obrero_inasistente + cocina_inasistente;
    const total_personal = personal_total_asistente + personal_total_inasistente;

    const pct_personal_asistencia = total_personal > 0
      ? ((personal_total_asistente / total_personal) * 100).toFixed(2)
      : '0.00';

    const total_docentes = docentes_asistente + docentes_inasistente;
    const pct_docentes = total_docentes > 0
      ? ((docentes_asistente / total_docentes) * 100).toFixed(2)
      : '0.00';

    const total_admin = admin_asistente + admin_inasistente;
    const pct_admin = total_admin > 0
      ? ((admin_asistente / total_admin) * 100).toFixed(2)
      : '0.00';

    const total_obrero = obrero_asistente + obrero_inasistente;
    const pct_obrero = total_obrero > 0
      ? ((obrero_asistente / total_obrero) * 100).toFixed(2)
      : '0.00';

    const total_cocina = cocina_asistente + cocina_inasistente;
    const pct_cocina = total_cocina > 0
      ? ((cocina_asistente / total_cocina) * 100).toFixed(2)
      : '0.00';

    return res.json({
      total_reportes,
      estudiantes_asistente,
      estudiantes_inasistente,
      pct_asistencia,
      docentes_asistente,
      docentes_inasistente,
      pct_docentes,
      admin_asistente,
      admin_inasistente,
      pct_admin,
      obrero_asistente,
      obrero_inasistente,
      pct_obrero,
      cocina_asistente,
      cocina_inasistente,
      pct_cocina,
      personal_total_asistente,
      personal_total_inasistente,
      total_personal,
      pct_personal_asistencia
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
};

exports.getPorMunicipio = async (req, res) => {
  try {
    const { desde, hasta, turno } = req.query;
    const where = {};

    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    }
    if (turno && ['MAÑANA', 'TARDE'].includes(turno)) {
      where.turno = turno;
    }

    const reportes = await Reporte.findAll({ where });
    const acumulado = {};

    reportes.forEach(r => {
      if (Array.isArray(r.municipio)) {
        r.municipio.forEach(mun => {
          if (!acumulado[mun]) {
            acumulado[mun] = {
              municipio: mun,
              reportes: 0,
              matricula_asistente: 0,
              matricula_inasistente: 0,
              docentes_asistente: 0,
              docentes_inasistente: 0,
              admin_asistente: 0,
              admin_inasistente: 0,
              obrero_asistente: 0,
              obrero_inasistente: 0,
              cocina_asistente: 0,
              cocina_inasistente: 0,
              personal_asistente: 0,
              personal_inasistente: 0
            };
          }
          acumulado[mun].reportes += 1;
          acumulado[mun].matricula_asistente += r.matricula_asistente || 0;
          acumulado[mun].matricula_inasistente += r.matricula_inasistente || 0;
          acumulado[mun].docentes_asistente += r.docentes_asistente || 0;
          acumulado[mun].docentes_inasistente += r.docentes_inasistente || 0;
          acumulado[mun].admin_asistente += r.admin_asistente || 0;
          acumulado[mun].admin_inasistente += r.admin_inasistente || 0;
          acumulado[mun].obrero_asistente += r.obrero_asistente || 0;
          acumulado[mun].obrero_inasistente += r.obrero_inasistente || 0;
          acumulado[mun].cocina_asistente += r.cocina_asistente || 0;
          acumulado[mun].cocina_inasistente += r.cocina_inasistente || 0;

          const pAsist = (r.docentes_asistente || 0) + (r.admin_asistente || 0) + (r.obrero_asistente || 0) + (r.cocina_asistente || 0);
          const pInasist = (r.docentes_inasistente || 0) + (r.admin_inasistente || 0) + (r.obrero_inasistente || 0) + (r.cocina_inasistente || 0);
          acumulado[mun].personal_asistente += pAsist;
          acumulado[mun].personal_inasistente += pInasist;
        });
      }
    });

    return res.json(Object.values(acumulado));
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
    }
    if (turno && ['MAÑANA', 'TARDE'].includes(turno)) {
      where.turno = turno;
    }
    if (municipio) {
      where.municipio = { [Op.contains]: [municipio.toUpperCase()] };
    }

    const reportes = await Reporte.findAll({
      where,
      order: [['fecha', 'ASC']]
    });

    const dias = {};
    reportes.forEach(r => {
      const fecha = r.fecha;
      if (!dias[fecha]) {
        dias[fecha] = {
          fecha,
          asistente: 0,
          inasistente: 0,
          reportes: 0
        };
      }
      dias[fecha].asistente += r.matricula_asistente || 0;
      dias[fecha].inasistente += r.matricula_inasistente || 0;
      dias[fecha].reportes += 1;
    });

    return res.json(Object.values(dias));
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
