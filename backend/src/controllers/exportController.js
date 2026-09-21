const ExcelJS = require('exceljs');
const { Reporte } = require('../models');
const { Op } = require('sequelize');

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

const HEADERS = [
  { header: 'Turno', key: 'turno', width: 12 },
  { header: 'Fecha', key: 'fecha', width: 14 },
  { header: 'Municipio', key: 'municipio', width: 20 },
  { header: 'Institución', key: 'nombre_institucion', width: 38 },
  { header: 'Manual', key: 'es_institucion_manual', width: 10 },
  { header: 'Director(a)', key: 'nombre_director', width: 28 },
  { header: 'Cédula', key: 'cedula', width: 15 },
  { header: 'Teléfono', key: 'telefono', width: 16 },
  { header: 'Est. Asist.', key: 'matricula_asistente', width: 13 },
  { header: 'Est. Inasist.', key: 'matricula_inasistente', width: 14 },
  { header: '% Asistencia', key: 'pct', width: 14 },
  { header: 'Doc. Asist.', key: 'docentes_asistente', width: 13 },
  { header: 'Doc. Inasist.', key: 'docentes_inasistente', width: 14 },
  { header: 'Adm. Asist.', key: 'admin_asistente', width: 13 },
  { header: 'Adm. Inasist.', key: 'admin_inasistente', width: 14 },
  { header: 'Obr. Asist.', key: 'obrero_asistente', width: 13 },
  { header: 'Obr. Inasist.', key: 'obrero_inasistente', width: 14 },
  { header: 'Coc. Asist.', key: 'cocina_asistente', width: 13 },
  { header: 'Coc. Inasist.', key: 'cocina_inasistente', width: 14 },
  { header: 'Hora de Registro', key: 'hora', width: 16 },
  { header: 'Incidencias / Observaciones', key: 'incidencias', width: 45 }
];

const aplicarEstilosHoja = (ws, data) => {
  ws.columns = HEADERS;

  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Azul oscuro elegante
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };
  });

  data.forEach((r, idx) => {
    const totalEst = (r.matricula_asistente || 0) + (r.matricula_inasistente || 0);
    const pct = totalEst > 0 ? `${(((r.matricula_asistente || 0) / totalEst) * 100).toFixed(1)}%` : '0.0%';

    const horaLocal = r.created_at
      ? new Date(r.created_at).toLocaleTimeString('es-VE', { hour12: false, timeZone: 'America/Caracas' })
      : '--:--';

    const row = ws.addRow({
      turno: r.turno,
      fecha: r.fecha,
      municipio: Array.isArray(r.municipio) ? r.municipio.join(', ') : r.municipio,
      nombre_institucion: r.nombre_institucion,
      es_institucion_manual: r.es_institucion_manual ? 'SÍ' : 'NO',
      nombre_director: r.nombre_director,
      cedula: r.cedula,
      telefono: r.telefono,
      matricula_asistente: r.matricula_asistente || 0,
      matricula_inasistente: r.matricula_inasistente || 0,
      pct,
      docentes_asistente: r.docentes_asistente || 0,
      docentes_inasistente: r.docentes_inasistente || 0,
      admin_asistente: r.admin_asistente || 0,
      admin_inasistente: r.admin_inasistente || 0,
      obrero_asistente: r.obrero_asistente || 0,
      obrero_inasistente: r.obrero_inasistente || 0,
      cocina_asistente: r.cocina_asistente || 0,
      cocina_inasistente: r.cocina_inasistente || 0,
      hora: horaLocal,
      incidencias: r.incidencias
    });

    row.height = 22;

    // Resaltar instituciones manuales con fondo tenue
    if (r.es_institucion_manual) {
      row.getCell('nombre_institucion').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3CD' } // amarillo suave
      };
      row.getCell('es_institucion_manual').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3CD' }
      };
    }

    // Alineaciones numéricas
    ['matricula_asistente', 'matricula_inasistente', 'pct', 'docentes_asistente', 'docentes_inasistente',
      'admin_asistente', 'admin_inasistente', 'obrero_asistente', 'obrero_inasistente',
      'cocina_asistente', 'cocina_inasistente', 'hora', 'fecha', 'turno', 'es_institucion_manual'].forEach(k => {
      row.getCell(k).alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

  ws.autoFilter = { from: 'A1', to: 'U1' };
};

exports.exportExcel = async (req, res) => {
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
      order: [['fecha', 'DESC'], ['created_at', 'DESC']]
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'SISEDGUA - Zona Educativa Guárico';
    wb.created = new Date();

    // 1. Hoja Consolidada General
    const wsGeneral = wb.addWorksheet('CONSOLIDADO GENERAL');
    aplicarEstilosHoja(wsGeneral, reportes);

    // 2. Hojas individuales por cada Municipio que contenga registros
    MUNICIPIOS.forEach(mun => {
      const filtrados = reportes.filter(r => Array.isArray(r.municipio) && r.municipio.includes(mun));
      if (filtrados.length > 0) {
        const wsMun = wb.addWorksheet(mun.substring(0, 30));
        aplicarEstilosHoja(wsMun, filtrados);
      }
    });

    // 3. Hoja separada para Instituciones Manuales / No Catálogadas
    const manuales = reportes.filter(r => r.es_institucion_manual);
    if (manuales.length > 0) {
      const wsManual = wb.addWorksheet('INSTITUCIONES MANUALES');
      aplicarEstilosHoja(wsManual, manuales);
    }

    const filename = `Reporte_Asistencia_Guarico_${desde || 'inicio'}_al_${hasta || 'cierre'}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Error generando archivo Excel:', error);
    return res.status(500).json({ error: 'Error al generar la exportación en Excel' });
  }
};
