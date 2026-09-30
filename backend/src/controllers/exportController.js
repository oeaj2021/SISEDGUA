const ExcelJS = require('exceljs');
const { Reporte, Institucion } = require('../models');
const { Op } = require('sequelize');

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const getSemanaInfo = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNum = d.getDay() || 7; // Domingo es 7
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

  // Calcular Lunes y Viernes de esa semana
  const curr = new Date(dateStr + 'T00:00:00');
  const day = curr.getDay();
  const diffToMon = curr.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(curr);
  monday.setDate(diffToMon);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const fmt = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  };

  return {
    clave: `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`,
    label: `Semana ${weekNo} (${fmt(monday)} al ${fmt(friday)})`,
    weekNo,
    year: d.getFullYear()
  };
};

const estilizarEncabezado = (ws, bgColor = 'FF1E3A8A') => {
  const headerRow = ws.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });
};

const estilizarFilaTotal = (row, bgColor = 'FFE2E8F0') => {
  row.height = 24;
  row.eachCell(cell => {
    cell.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });
};

const HEADERS_DETALLE = [
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

const aplicarEstilosHojaDetalle = (ws, data) => {
  ws.columns = HEADERS_DETALLE;
  estilizarEncabezado(ws, 'FF1E3A8A');

  data.forEach(r => {
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

    if (r.es_institucion_manual) {
      row.getCell('nombre_institucion').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3CD' }
      };
      row.getCell('es_institucion_manual').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3CD' }
      };
    }

    ['matricula_asistente', 'matricula_inasistente', 'pct', 'docentes_asistente', 'docentes_inasistente',
      'admin_asistente', 'admin_inasistente', 'obrero_asistente', 'obrero_inasistente',
      'cocina_asistente', 'cocina_inasistente', 'hora', 'fecha', 'turno', 'es_institucion_manual'].forEach(k => {
      row.getCell(k).alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

  ws.autoFilter = { from: 'A1', to: 'U1' };
};

// Generar Resumen Diario
const agregarHojaResumenDiario = (wb, reportes) => {
  const ws = wb.addWorksheet('RESUMEN DIARIO');
  ws.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Día', key: 'dia_semana', width: 14 },
    { header: 'Inst. Reportadas', key: 'inst_count', width: 17 },
    { header: 'Est. Asist.', key: 'est_asist', width: 13 },
    { header: 'Est. Inasist.', key: 'est_inasist', width: 14 },
    { header: 'Total Est.', key: 'est_total', width: 13 },
    { header: '% Asist. Est.', key: 'est_pct', width: 14 },
    { header: 'Doc. Asist.', key: 'doc_asist', width: 13 },
    { header: 'Doc. Inasist.', key: 'doc_inasist', width: 14 },
    { header: '% Asist. Doc.', key: 'doc_pct', width: 14 },
    { header: 'Adm. Asist.', key: 'adm_asist', width: 13 },
    { header: 'Adm. Inasist.', key: 'adm_inasist', width: 14 },
    { header: 'Obr. Asist.', key: 'obr_asist', width: 13 },
    { header: 'Obr. Inasist.', key: 'obr_inasist', width: 14 },
    { header: 'Coc. Asist.', key: 'coc_asist', width: 13 },
    { header: 'Coc. Inasist.', key: 'coc_inasist', width: 14 },
    { header: 'Total Pers. Asist.', key: 'pers_asist', width: 17 },
    { header: 'Total Pers. Inasist.', key: 'pers_inasist', width: 18 },
    { header: 'Total Personal', key: 'pers_total', width: 15 },
    { header: '% Asist. Pers.', key: 'pers_pct', width: 14 },
    { header: '% Asist. Global', key: 'global_pct', width: 15 }
  ];

  estilizarEncabezado(ws, 'FF1D4ED8'); // Azul rey

  const diasMap = {};
  reportes.forEach(r => {
    const f = r.fecha;
    if (!diasMap[f]) {
      const dt = new Date(f + 'T00:00:00');
      diasMap[f] = {
        fecha: f,
        dia_semana: DIAS_SEMANA[dt.getDay()],
        instituciones: new Set(),
        est_asist: 0,
        est_inasist: 0,
        doc_asist: 0,
        doc_inasist: 0,
        adm_asist: 0,
        adm_inasist: 0,
        obr_asist: 0,
        obr_inasist: 0,
        coc_asist: 0,
        coc_inasist: 0
      };
    }

    const instKey = r.institucion_id || r.nombre_institucion?.trim().toUpperCase();
    if (instKey) diasMap[f].instituciones.add(instKey);

    diasMap[f].est_asist += r.matricula_asistente || 0;
    diasMap[f].est_inasist += r.matricula_inasistente || 0;
    diasMap[f].doc_asist += r.docentes_asistente || 0;
    diasMap[f].doc_inasist += r.docentes_inasistente || 0;
    diasMap[f].adm_asist += r.admin_asistente || 0;
    diasMap[f].adm_inasist += r.admin_inasistente || 0;
    diasMap[f].obr_asist += r.obrero_asistente || 0;
    diasMap[f].obr_inasist += r.obrero_inasistente || 0;
    diasMap[f].coc_asist += r.cocina_asistente || 0;
    diasMap[f].coc_inasist += r.cocina_inasistente || 0;
  });

  const diasOrdenados = Object.values(diasMap).sort((a, b) => a.fecha.localeCompare(b.fecha));

  let totInst = 0, totEstA = 0, totEstI = 0, totDocA = 0, totDocI = 0;
  let totAdmA = 0, totAdmI = 0, totObrA = 0, totObrI = 0, totCocA = 0, totCocI = 0;

  diasOrdenados.forEach(d => {
    const instCount = d.instituciones.size;
    const estTotal = d.est_asist + d.est_inasist;
    const estPct = estTotal > 0 ? `${((d.est_asist / estTotal) * 100).toFixed(1)}%` : '0.0%';

    const docTotal = d.doc_asist + d.doc_inasist;
    const docPct = docTotal > 0 ? `${((d.doc_asist / docTotal) * 100).toFixed(1)}%` : '0.0%';

    const persAsist = d.doc_asist + d.adm_asist + d.obr_asist + d.coc_asist;
    const persInasist = d.doc_inasist + d.adm_inasist + d.obr_inasist + d.coc_inasist;
    const persTotal = persAsist + persInasist;
    const persPct = persTotal > 0 ? `${((persAsist / persTotal) * 100).toFixed(1)}%` : '0.0%';

    const granTotal = estTotal + persTotal;
    const granAsist = d.est_asist + persAsist;
    const globalPct = granTotal > 0 ? `${((granAsist / granTotal) * 100).toFixed(1)}%` : '0.0%';

    totInst += instCount;
    totEstA += d.est_asist;
    totEstI += d.est_inasist;
    totDocA += d.doc_asist;
    totDocI += d.doc_inasist;
    totAdmA += d.adm_asist;
    totAdmI += d.adm_inasist;
    totObrA += d.obr_asist;
    totObrI += d.obr_inasist;
    totCocA += d.coc_asist;
    totCocI += d.coc_inasist;

    const row = ws.addRow({
      fecha: d.fecha,
      dia_semana: d.dia_semana,
      inst_count: instCount,
      est_asist: d.est_asist,
      est_inasist: d.est_inasist,
      est_total: estTotal,
      est_pct: estPct,
      doc_asist: d.doc_asist,
      doc_inasist: d.doc_inasist,
      doc_pct: docPct,
      adm_asist: d.adm_asist,
      adm_inasist: d.adm_inasist,
      obr_asist: d.obr_asist,
      obr_inasist: d.obr_inasist,
      coc_asist: d.coc_asist,
      coc_inasist: d.coc_inasist,
      pers_asist: persAsist,
      pers_inasist: persInasist,
      pers_total: persTotal,
      pers_pct: persPct,
      global_pct: globalPct
    });

    row.height = 20;
    row.eachCell(c => {
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

  // Fila de Total / Consolidado
  const tEstTotal = totEstA + totEstI;
  const tDocTotal = totDocA + totDocI;
  const tPersAsist = totDocA + totAdmA + totObrA + totCocA;
  const tPersInasist = totDocI + totAdmI + totObrI + totCocI;
  const tPersTotal = tPersAsist + tPersInasist;
  const tGranTotal = tEstTotal + tPersTotal;
  const tGranAsist = totEstA + tPersAsist;

  const totalRow = ws.addRow({
    fecha: 'TOTALES',
    dia_semana: `${diasOrdenados.length} días`,
    inst_count: totInst,
    est_asist: totEstA,
    est_inasist: totEstI,
    est_total: tEstTotal,
    est_pct: tEstTotal > 0 ? `${((totEstA / tEstTotal) * 100).toFixed(1)}%` : '0.0%',
    doc_asist: totDocA,
    doc_inasist: totDocI,
    doc_pct: tDocTotal > 0 ? `${((totDocA / tDocTotal) * 100).toFixed(1)}%` : '0.0%',
    adm_asist: totAdmA,
    adm_inasist: totAdmI,
    obr_asist: totObrA,
    obr_inasist: totObrI,
    coc_asist: totCocA,
    coc_inasist: totCocI,
    pers_asist: tPersAsist,
    pers_inasist: tPersInasist,
    pers_total: tPersTotal,
    pers_pct: tPersTotal > 0 ? `${((tPersAsist / tPersTotal) * 100).toFixed(1)}%` : '0.0%',
    global_pct: tGranTotal > 0 ? `${((tGranAsist / tGranTotal) * 100).toFixed(1)}%` : '0.0%'
  });

  estilizarFilaTotal(totalRow, 'FFDBEAFE');
  totalRow.eachCell(c => {
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
};

// Generar Resumen por Turno (MAÑANA vs TARDE y desglose diario)
const agregarHojaResumenTurno = (wb, reportes) => {
  const ws = wb.addWorksheet('RESUMEN POR TURNO');
  ws.columns = [
    { header: 'Turno', key: 'turno', width: 14 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Inst. Reportadas', key: 'inst_count', width: 17 },
    { header: 'Est. Asist.', key: 'est_asist', width: 13 },
    { header: 'Est. Inasist.', key: 'est_inasist', width: 14 },
    { header: 'Total Est.', key: 'est_total', width: 13 },
    { header: '% Asist. Est.', key: 'est_pct', width: 14 },
    { header: 'Doc. Asist.', key: 'doc_asist', width: 13 },
    { header: 'Doc. Inasist.', key: 'doc_inasist', width: 14 },
    { header: '% Asist. Doc.', key: 'doc_pct', width: 14 },
    { header: 'Total Pers. Asist.', key: 'pers_asist', width: 17 },
    { header: 'Total Pers. Inasist.', key: 'pers_inasist', width: 18 },
    { header: 'Total Personal', key: 'pers_total', width: 15 },
    { header: '% Asist. Pers.', key: 'pers_pct', width: 14 },
    { header: '% Asist. Global', key: 'global_pct', width: 15 }
  ];

  estilizarEncabezado(ws, 'FF4F46E5'); // Índigo profesional

  // 1. Agrupar por Turno Global
  const porTurnoGlobal = {
    'MAÑANA': { turno: 'MAÑANA', reportes: 0, instituciones: new Set(), estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0 },
    'TARDE': { turno: 'TARDE', reportes: 0, instituciones: new Set(), estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0 }
  };

  // 2. Agrupar por Fecha x Turno
  const fechaTurnoMap = {};

  reportes.forEach(r => {
    const t = r.turno === 'TARDE' ? 'TARDE' : 'MAÑANA';
    const f = r.fecha;
    const ftKey = `${f}_${t}`;

    const instKey = r.institucion_id || r.nombre_institucion?.trim().toUpperCase();
    if (instKey) {
      porTurnoGlobal[t].instituciones.add(instKey);
    }
    porTurnoGlobal[t].reportes += 1;
    porTurnoGlobal[t].estA += r.matricula_asistente || 0;
    porTurnoGlobal[t].estI += r.matricula_inasistente || 0;
    porTurnoGlobal[t].docA += r.docentes_asistente || 0;
    porTurnoGlobal[t].docI += r.docentes_inasistente || 0;
    porTurnoGlobal[t].admA += r.admin_asistente || 0;
    porTurnoGlobal[t].admI += r.admin_inasistente || 0;
    porTurnoGlobal[t].obrA += r.obrero_asistente || 0;
    porTurnoGlobal[t].obrI += r.obrero_inasistente || 0;
    porTurnoGlobal[t].cocA += r.cocina_asistente || 0;
    porTurnoGlobal[t].cocI += r.cocina_inasistente || 0;

    if (!fechaTurnoMap[ftKey]) {
      fechaTurnoMap[ftKey] = {
        fecha: f,
        turno: t,
        instituciones: new Set(),
        estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0
      };
    }
    if (instKey) fechaTurnoMap[ftKey].instituciones.add(instKey);
    fechaTurnoMap[ftKey].estA += r.matricula_asistente || 0;
    fechaTurnoMap[ftKey].estI += r.matricula_inasistente || 0;
    fechaTurnoMap[ftKey].docA += r.docentes_asistente || 0;
    fechaTurnoMap[ftKey].docI += r.docentes_inasistente || 0;
    fechaTurnoMap[ftKey].admA += r.admin_asistente || 0;
    fechaTurnoMap[ftKey].admI += r.admin_inasistente || 0;
    fechaTurnoMap[ftKey].obrA += r.obrero_asistente || 0;
    fechaTurnoMap[ftKey].obrI += r.obrero_inasistente || 0;
    fechaTurnoMap[ftKey].cocA += r.cocina_asistente || 0;
    fechaTurnoMap[ftKey].cocI += r.cocina_inasistente || 0;
  });

  // Agregar filas de resumen global por turno
  ['MAÑANA', 'TARDE'].forEach(t => {
    const item = porTurnoGlobal[t];
    const estTotal = item.estA + item.estI;
    const estPct = estTotal > 0 ? `${((item.estA / estTotal) * 100).toFixed(1)}%` : '0.0%';
    const docTotal = item.docA + item.docI;
    const docPct = docTotal > 0 ? `${((item.docA / docTotal) * 100).toFixed(1)}%` : '0.0%';

    const pAsist = item.docA + item.admA + item.obrA + item.cocA;
    const pInasist = item.docI + item.admI + item.obrI + item.cocI;
    const pTotal = pAsist + pInasist;
    const pPct = pTotal > 0 ? `${((pAsist / pTotal) * 100).toFixed(1)}%` : '0.0%';

    const gTotal = estTotal + pTotal;
    const gAsist = item.estA + pAsist;
    const gPct = gTotal > 0 ? `${((gAsist / gTotal) * 100).toFixed(1)}%` : '0.0%';

    const row = ws.addRow({
      turno: `TOTAL ${t}`,
      fecha: 'TODAS',
      inst_count: item.instituciones.size,
      est_asist: item.estA,
      est_inasist: item.estI,
      est_total: estTotal,
      est_pct: estPct,
      doc_asist: item.docA,
      doc_inasist: item.docI,
      doc_pct: docPct,
      pers_asist: pAsist,
      pers_inasist: pInasist,
      pers_total: pTotal,
      pers_pct: pPct,
      global_pct: gPct
    });

    estilizarFilaTotal(row, t === 'MAÑANA' ? 'FFFEF3C7' : 'FFE0E7FF'); // Ámbar tenue vs Índigo tenue
    row.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });

  // Fila separadora
  const sep = ws.addRow({ turno: '--- DETALLE DIARIO POR TURNO ---' });
  sep.font = { bold: true, italic: true, color: { argb: 'FF64748B' } };

  // Detalle por Fecha y Turno
  const ftList = Object.values(fechaTurnoMap).sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    return a.turno.localeCompare(b.turno);
  });

  ftList.forEach(ft => {
    const estTotal = ft.estA + ft.estI;
    const estPct = estTotal > 0 ? `${((ft.estA / estTotal) * 100).toFixed(1)}%` : '0.0%';
    const docTotal = ft.docA + ft.docI;
    const docPct = docTotal > 0 ? `${((ft.docA / docTotal) * 100).toFixed(1)}%` : '0.0%';

    const pAsist = ft.docA + ft.admA + ft.obrA + ft.cocA;
    const pInasist = ft.docI + ft.admI + ft.obrI + ft.cocI;
    const pTotal = pAsist + pInasist;
    const pPct = pTotal > 0 ? `${((pAsist / pTotal) * 100).toFixed(1)}%` : '0.0%';

    const gTotal = estTotal + pTotal;
    const gAsist = ft.estA + pAsist;
    const gPct = gTotal > 0 ? `${((gAsist / gTotal) * 100).toFixed(1)}%` : '0.0%';

    const row = ws.addRow({
      turno: ft.turno,
      fecha: ft.fecha,
      inst_count: ft.instituciones.size,
      est_asist: ft.estA,
      est_inasist: ft.estI,
      est_total: estTotal,
      est_pct: estPct,
      doc_asist: ft.docA,
      doc_inasist: ft.docI,
      doc_pct: docPct,
      pers_asist: pAsist,
      pers_inasist: pInasist,
      pers_total: pTotal,
      pers_pct: pPct,
      global_pct: gPct
    });

    row.height = 20;
    row.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });
};

// Generar Resumen Semanal
const agregarHojaResumenSemanal = (wb, reportes) => {
  const ws = wb.addWorksheet('RESUMEN SEMANAL');
  ws.columns = [
    { header: 'Semana Calendario', key: 'semana', width: 34 },
    { header: 'Días con Registro', key: 'dias_count', width: 17 },
    { header: 'Inst. Reportadas', key: 'inst_count', width: 17 },
    { header: 'Est. Asist.', key: 'est_asist', width: 13 },
    { header: 'Est. Inasist.', key: 'est_inasist', width: 14 },
    { header: 'Total Est.', key: 'est_total', width: 13 },
    { header: '% Asist. Est.', key: 'est_pct', width: 14 },
    { header: 'Doc. Asist.', key: 'doc_asist', width: 13 },
    { header: 'Doc. Inasist.', key: 'doc_inasist', width: 14 },
    { header: '% Asist. Doc.', key: 'doc_pct', width: 14 },
    { header: 'Total Pers. Asist.', key: 'pers_asist', width: 17 },
    { header: 'Total Pers. Inasist.', key: 'pers_inasist', width: 18 },
    { header: 'Total Personal', key: 'pers_total', width: 15 },
    { header: '% Asist. Pers.', key: 'pers_pct', width: 14 },
    { header: '% Asist. Global', key: 'global_pct', width: 15 }
  ];

  estilizarEncabezado(ws, 'FF047857'); // Verde Esmeralda Sala Situacional

  const semanasMap = {};
  reportes.forEach(r => {
    const semInfo = getSemanaInfo(r.fecha);
    const key = semInfo.clave;

    if (!semanasMap[key]) {
      semanasMap[key] = {
        label: semInfo.label,
        clave: semInfo.clave,
        dias: new Set(),
        instituciones: new Set(),
        estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0
      };
    }

    semanasMap[key].dias.add(r.fecha);
    const instKey = r.institucion_id || r.nombre_institucion?.trim().toUpperCase();
    if (instKey) semanasMap[key].instituciones.add(instKey);

    semanasMap[key].estA += r.matricula_asistente || 0;
    semanasMap[key].estI += r.matricula_inasistente || 0;
    semanasMap[key].docA += r.docentes_asistente || 0;
    semanasMap[key].docI += r.docentes_inasistente || 0;
    semanasMap[key].admA += r.admin_asistente || 0;
    semanasMap[key].admI += r.admin_inasistente || 0;
    semanasMap[key].obrA += r.obrero_asistente || 0;
    semanasMap[key].obrI += r.obrero_inasistente || 0;
    semanasMap[key].cocA += r.cocina_asistente || 0;
    semanasMap[key].cocI += r.cocina_inasistente || 0;
  });

  const semanasOrdenadas = Object.values(semanasMap).sort((a, b) => a.clave.localeCompare(b.clave));

  let totEstA = 0, totEstI = 0, totDocA = 0, totDocI = 0, totPersA = 0, totPersI = 0;

  semanasOrdenadas.forEach(s => {
    const estTotal = s.estA + s.estI;
    const estPct = estTotal > 0 ? `${((s.estA / estTotal) * 100).toFixed(1)}%` : '0.0%';
    const docTotal = s.docA + s.docI;
    const docPct = docTotal > 0 ? `${((s.docA / docTotal) * 100).toFixed(1)}%` : '0.0%';

    const pAsist = s.docA + s.admA + s.obrA + s.cocA;
    const pInasist = s.docI + s.admI + s.obrI + s.cocI;
    const pTotal = pAsist + pInasist;
    const pPct = pTotal > 0 ? `${((pAsist / pTotal) * 100).toFixed(1)}%` : '0.0%';

    const gTotal = estTotal + pTotal;
    const gAsist = s.estA + pAsist;
    const gPct = gTotal > 0 ? `${((gAsist / gTotal) * 100).toFixed(1)}%` : '0.0%';

    totEstA += s.estA;
    totEstI += s.estI;
    totDocA += s.docA;
    totDocI += s.docI;
    totPersA += pAsist;
    totPersI += pInasist;

    const row = ws.addRow({
      semana: s.label,
      dias_count: s.dias.size,
      inst_count: s.instituciones.size,
      est_asist: s.estA,
      est_inasist: s.estI,
      est_total: estTotal,
      est_pct: estPct,
      doc_asist: s.docA,
      doc_inasist: s.docI,
      doc_pct: docPct,
      pers_asist: pAsist,
      pers_inasist: pInasist,
      pers_total: pTotal,
      pers_pct: pPct,
      global_pct: gPct
    });

    row.height = 22;
    row.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });

  // Fila consolidada final
  const tEstTotal = totEstA + totEstI;
  const tDocTotal = totDocA + totDocI;
  const tPersTotal = totPersA + totPersI;
  const tGranTotal = tEstTotal + tPersTotal;
  const tGranAsist = totEstA + totPersA;

  const totalRow = ws.addRow({
    semana: `TOTAL GENERAL (${semanasOrdenadas.length} semanas)`,
    dias_count: '--',
    inst_count: '--',
    est_asist: totEstA,
    est_inasist: totEstI,
    est_total: tEstTotal,
    est_pct: tEstTotal > 0 ? `${((totEstA / tEstTotal) * 100).toFixed(1)}%` : '0.0%',
    doc_asist: totDocA,
    doc_inasist: totDocI,
    doc_pct: tDocTotal > 0 ? `${((totDocA / tDocTotal) * 100).toFixed(1)}%` : '0.0%',
    pers_asist: totPersA,
    pers_inasist: totPersI,
    pers_total: tPersTotal,
    pers_pct: tPersTotal > 0 ? `${((totPersA / tPersTotal) * 100).toFixed(1)}%` : '0.0%',
    global_pct: tGranTotal > 0 ? `${((tGranAsist / tGranTotal) * 100).toFixed(1)}%` : '0.0%'
  });

  estilizarFilaTotal(totalRow, 'FFD1FAE5'); // Verde suave
  totalRow.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
};

// Generar Resumen por Municipio
const agregarHojaResumenMunicipio = (wb, reportes, todasInstituciones) => {
  const ws = wb.addWorksheet('RESUMEN POR MUNICIPIO');
  ws.columns = [
    { header: 'Municipio', key: 'municipio', width: 20 },
    { header: 'Inst. en Catálogo', key: 'total_catalogo', width: 17 },
    { header: 'Inst. Reportaron', key: 'reportadas', width: 17 },
    { header: 'Inst. Faltantes', key: 'faltantes', width: 16 },
    { header: '% Cobertura Inst.', key: 'pct_cobertura', width: 18 },
    { header: 'Est. Asist.', key: 'est_asist', width: 13 },
    { header: 'Est. Inasist.', key: 'est_inasist', width: 14 },
    { header: 'Total Est.', key: 'est_total', width: 13 },
    { header: '% Asist. Est.', key: 'est_pct', width: 14 },
    { header: 'Doc. Asist.', key: 'doc_asist', width: 13 },
    { header: 'Doc. Inasist.', key: 'doc_inasist', width: 14 },
    { header: '% Asist. Doc.', key: 'doc_pct', width: 14 },
    { header: 'Total Pers. Asist.', key: 'pers_asist', width: 17 },
    { header: 'Total Pers. Inasist.', key: 'pers_inasist', width: 18 },
    { header: 'Total Personal', key: 'pers_total', width: 15 },
    { header: '% Asist. Pers.', key: 'pers_pct', width: 14 },
    { header: '% Asist. Global', key: 'global_pct', width: 15 }
  ];

  estilizarEncabezado(ws, 'FF0F766E'); // Verde Azulado Teal Elegante

  const instPorMun = {};
  todasInstituciones.forEach(inst => {
    const m = inst.municipio;
    if (!instPorMun[m]) instPorMun[m] = [];
    instPorMun[m].push(inst);
  });

  const repPorMun = {};
  MUNICIPIOS.forEach(m => {
    repPorMun[m] = {
      municipio: m,
      instReportadas: new Set(),
      estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0
    };
  });

  reportes.forEach(r => {
    const muns = Array.isArray(r.municipio) ? r.municipio : [r.municipio];
    muns.forEach(m => {
      const munNorm = m ? m.toUpperCase().trim() : '';
      if (repPorMun[munNorm]) {
        const instKey = r.institucion_id || r.nombre_institucion?.trim().toUpperCase();
        if (instKey) repPorMun[munNorm].instReportadas.add(instKey);
        repPorMun[munNorm].estA += r.matricula_asistente || 0;
        repPorMun[munNorm].estI += r.matricula_inasistente || 0;
        repPorMun[munNorm].docA += r.docentes_asistente || 0;
        repPorMun[munNorm].docI += r.docentes_inasistente || 0;
        repPorMun[munNorm].admA += r.admin_asistente || 0;
        repPorMun[munNorm].admI += r.admin_inasistente || 0;
        repPorMun[munNorm].obrA += r.obrero_asistente || 0;
        repPorMun[munNorm].obrI += r.obrero_inasistente || 0;
        repPorMun[munNorm].cocA += r.cocina_asistente || 0;
        repPorMun[munNorm].cocI += r.cocina_inasistente || 0;
      }
    });
  });

  let tCat = 0, tRep = 0, tFalt = 0, tEstA = 0, tEstI = 0, tDocA = 0, tDocI = 0, tPersA = 0, tPersI = 0;

  MUNICIPIOS.forEach(mun => {
    const catTotal = (instPorMun[mun] || []).length;
    const rData = repPorMun[mun];
    const repCount = rData.instReportadas.size;
    const faltantes = Math.max(0, catTotal - repCount);
    const pctCob = catTotal > 0 ? `${((repCount / catTotal) * 100).toFixed(1)}%` : '--';

    const estTotal = rData.estA + rData.estI;
    const estPct = estTotal > 0 ? `${((rData.estA / estTotal) * 100).toFixed(1)}%` : '0.0%';
    const docTotal = rData.docA + rData.docI;
    const docPct = docTotal > 0 ? `${((rData.docA / docTotal) * 100).toFixed(1)}%` : '0.0%';

    const pAsist = rData.docA + rData.admA + rData.obrA + rData.cocA;
    const pInasist = rData.docI + rData.admI + rData.obrI + rData.cocI;
    const pTotal = pAsist + pInasist;
    const pPct = pTotal > 0 ? `${((pAsist / pTotal) * 100).toFixed(1)}%` : '0.0%';

    const gTotal = estTotal + pTotal;
    const gAsist = rData.estA + pAsist;
    const gPct = gTotal > 0 ? `${((gAsist / gTotal) * 100).toFixed(1)}%` : '0.0%';

    tCat += catTotal;
    tRep += repCount;
    tFalt += faltantes;
    tEstA += rData.estA;
    tEstI += rData.estI;
    tDocA += rData.docA;
    tDocI += rData.docI;
    tPersA += pAsist;
    tPersI += pInasist;

    const row = ws.addRow({
      municipio: mun,
      total_catalogo: catTotal,
      reportadas: repCount,
      faltantes,
      pct_cobertura: pctCob,
      est_asist: rData.estA,
      est_inasist: rData.estI,
      est_total: estTotal,
      est_pct: estPct,
      doc_asist: rData.docA,
      doc_inasist: rData.docI,
      doc_pct: docPct,
      pers_asist: pAsist,
      pers_inasist: pInasist,
      pers_total: pTotal,
      pers_pct: pPct,
      global_pct: gPct
    });

    row.height = 20;
    row.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });

  // Fila total del estado Guárico
  const totalRow = ws.addRow({
    municipio: 'ESTADO GUÁRICO',
    total_catalogo: tCat,
    reportadas: tRep,
    faltantes: tFalt,
    pct_cobertura: tCat > 0 ? `${((tRep / tCat) * 100).toFixed(1)}%` : '0.0%',
    est_asist: tEstA,
    est_inasist: tEstI,
    est_total: tEstA + tEstI,
    est_pct: (tEstA + tEstI) > 0 ? `${((tEstA / (tEstA + tEstI)) * 100).toFixed(1)}%` : '0.0%',
    doc_asist: tDocA,
    doc_inasist: tDocI,
    doc_pct: (tDocA + tDocI) > 0 ? `${((tDocA / (tDocA + tDocI)) * 100).toFixed(1)}%` : '0.0%',
    pers_asist: tPersA,
    pers_inasist: tPersI,
    pers_total: tPersA + tPersI,
    pers_pct: (tPersA + tPersI) > 0 ? `${((tPersA / (tPersA + tPersI)) * 100).toFixed(1)}%` : '0.0%',
    global_pct: (tEstA + tEstI + tPersA + tPersI) > 0
      ? `${(((tEstA + tPersA) / (tEstA + tEstI + tPersA + tPersI)) * 100).toFixed(1)}%`
      : '0.0%'
  });

  estilizarFilaTotal(totalRow, 'FFCCFBF1'); // Teal suave
  totalRow.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
};

// Generar Hoja de Instituciones Sin Reportar
const agregarHojaNoReportadas = (wb, noReportadas) => {
  const ws = wb.addWorksheet('INSTITUCIONES SIN REPORTAR');
  ws.columns = [
    { header: 'Municipio', key: 'municipio', width: 22 },
    { header: 'Nombre de la Institución', key: 'nombre', width: 45 },
    { header: 'Código DEA / Plantel', key: 'codigo', width: 20 },
    { header: 'Turno Oficial', key: 'turno', width: 15 },
    { header: 'Matrícula Esperada', key: 'max_matricula', width: 18 },
    { header: 'Docentes Esperados', key: 'max_docentes', width: 18 },
    { header: 'Estado', key: 'estado', width: 25 }
  ];

  estilizarEncabezado(ws, 'FFB91C1C'); // Rojo institucional

  noReportadas.forEach(inst => {
    const row = ws.addRow({
      municipio: inst.municipio,
      nombre: inst.nombre,
      codigo: inst.codigo || 'S/C',
      turno: inst.turno || 'AMBOS',
      max_matricula: inst.max_matricula || 0,
      max_docentes: inst.max_docentes || 0,
      estado: '⚠️ PENDIENTE POR REPORTAR'
    });

    row.height = 20;

    row.getCell('municipio').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('codigo').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('turno').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('max_matricula').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('max_docentes').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('estado').alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell('estado').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEE2E2' } // Rojo tenue
    };
    row.getCell('estado').font = {
      color: { argb: 'FF991B1B' },
      bold: true,
      size: 10
    };
  });

  ws.autoFilter = { from: 'A1', to: 'G1' };
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
      where.municipio = { [Op.contains]: [municipio.toUpperCase().trim()] };
    }

    const [reportes, todasInstituciones] = await Promise.all([
      Reporte.findAll({
        where,
        order: [['fecha', 'DESC'], ['created_at', 'DESC']]
      }),
      Institucion.findAll({
        where: { activo: true },
        order: [['municipio', 'ASC'], ['nombre', 'ASC']]
      })
    ]);

    // Calcular instituciones que NO han reportado en el período
    const reportedIds = new Set(reportes.map(r => r.institucion_id).filter(Boolean));
    const reportedNames = new Set(reportes.map(r => r.nombre_institucion ? r.nombre_institucion.trim().toUpperCase() : '').filter(Boolean));

    const noReportadas = todasInstituciones.filter(inst => {
      if (municipio && inst.municipio !== municipio.toUpperCase().trim()) return false;
      if (turno && ['MAÑANA', 'TARDE'].includes(turno) && !['AMBOS', turno].includes(inst.turno)) return false;
      if (inst.id && reportedIds.has(inst.id)) return false;
      if (inst.nombre && reportedNames.has(inst.nombre.trim().toUpperCase())) return false;
      return true;
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sala Situacional CDCE ESTADAL GUÁRICO';
    wb.title = 'Reporte y Resumen de Asistencia - CDCE ESTADAL GUÁRICO';
    wb.created = new Date();

    // 1. Resumen Diario
    agregarHojaResumenDiario(wb, reportes);

    // 2. Resumen por Turno
    agregarHojaResumenTurno(wb, reportes);

    // 3. Resumen Semanal
    agregarHojaResumenSemanal(wb, reportes);

    // 4. Resumen por Municipio
    agregarHojaResumenMunicipio(wb, reportes, todasInstituciones);

    // 5. Instituciones Sin Reportar
    agregarHojaNoReportadas(wb, noReportadas);

    // 6. Hoja Consolidada General Detallada
    const wsGeneral = wb.addWorksheet('CONSOLIDADO GENERAL');
    aplicarEstilosHojaDetalle(wsGeneral, reportes);

    // 7. Hojas individuales por cada Municipio que tenga registros
    MUNICIPIOS.forEach(mun => {
      const filtrados = reportes.filter(r => Array.isArray(r.municipio) && r.municipio.includes(mun));
      if (filtrados.length > 0) {
        const wsMun = wb.addWorksheet(mun.substring(0, 30));
        aplicarEstilosHojaDetalle(wsMun, filtrados);
      }
    });

    // 8. Hoja para Instituciones Manuales
    const manuales = reportes.filter(r => r.es_institucion_manual);
    if (manuales.length > 0) {
      const wsManual = wb.addWorksheet('INSTITUCIONES MANUALES');
      aplicarEstilosHojaDetalle(wsManual, manuales);
    }

    const filename = `Reporte_Resumen_Asistencia_Guarico_${desde || 'inicio'}_al_${hasta || 'cierre'}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Error generando archivo Excel:', error);
    return res.status(500).json({ error: 'Error al generar la exportación en Excel' });
  }
};
