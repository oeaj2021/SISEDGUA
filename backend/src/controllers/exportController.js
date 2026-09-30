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

const estilizarEncabezado = (ws, bgColor = 'FF1E3A8A', rowNumber = 1) => {
  const headerRow = ws.getRow(rowNumber);
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

// 1. Resumen Diario (Estadal o por Municipio específico)
const agregarHojaResumenDiario = (wb, reportes, nombreHoja = 'RESUMEN DIARIO') => {
  const ws = wb.addWorksheet(nombreHoja.substring(0, 31));
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

  estilizarEncabezado(ws, 'FF1D4ED8');

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

// 2. Resumen por Turno (Estadal o por Municipio)
const agregarHojaResumenTurno = (wb, reportes, nombreHoja = 'RESUMEN POR TURNO') => {
  const ws = wb.addWorksheet(nombreHoja.substring(0, 31));
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

  estilizarEncabezado(ws, 'FF4F46E5');

  const porTurnoGlobal = {
    'MAÑANA': { turno: 'MAÑANA', instituciones: new Set(), estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0 },
    'TARDE': { turno: 'TARDE', instituciones: new Set(), estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0 }
  };

  const fechaTurnoMap = {};

  reportes.forEach(r => {
    const t = r.turno === 'TARDE' ? 'TARDE' : 'MAÑANA';
    const f = r.fecha;
    const ftKey = `${f}_${t}`;

    const instKey = r.institucion_id || r.nombre_institucion?.trim().toUpperCase();
    if (instKey) porTurnoGlobal[t].instituciones.add(instKey);

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

    estilizarFilaTotal(row, t === 'MAÑANA' ? 'FFFEF3C7' : 'FFE0E7FF');
    row.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });

  const sep = ws.addRow({ turno: '--- DETALLE DIARIO POR TURNO ---' });
  sep.font = { bold: true, italic: true, color: { argb: 'FF64748B' } };

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

// 3. Resumen Semanal (Estadal o por Municipio)
const agregarHojaResumenSemanal = (wb, reportes, nombreHoja = 'RESUMEN SEMANAL') => {
  const ws = wb.addWorksheet(nombreHoja.substring(0, 31));
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

  estilizarEncabezado(ws, 'FF047857');

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

  estilizarFilaTotal(totalRow, 'FFD1FAE5');
  totalRow.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
};

// 4. Resumen General Consolidado por Municipio (15 municipios)
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

  estilizarEncabezado(ws, 'FF0F766E');

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

  estilizarFilaTotal(totalRow, 'FFCCFBF1');
  totalRow.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
};

// 5. NUEVO: Resumen Diario Desglosado por Municipio (Municipio x Día)
const agregarHojaDiarioPorMunicipio = (wb, reportes) => {
  const ws = wb.addWorksheet('DIARIO POR MUNICIPIO');
  ws.columns = [
    { header: 'Municipio', key: 'municipio', width: 20 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Día', key: 'dia', width: 13 },
    { header: 'Inst. Reportadas', key: 'inst_count', width: 17 },
    { header: 'Est. Asist.', key: 'est_asist', width: 13 },
    { header: 'Est. Inasist.', key: 'est_inasist', width: 14 },
    { header: 'Total Est.', key: 'est_total', width: 13 },
    { header: '% Asist. Est.', key: 'est_pct', width: 14 },
    { header: 'Doc. Asist.', key: 'doc_asist', width: 13 },
    { header: 'Doc. Inasist.', key: 'doc_inasist', width: 14 },
    { header: 'Total Pers. Asist.', key: 'pers_asist', width: 17 },
    { header: 'Total Pers. Inasist.', key: 'pers_inasist', width: 18 },
    { header: 'Total Personal', key: 'pers_total', width: 15 },
    { header: '% Asist. Pers.', key: 'pers_pct', width: 14 },
    { header: '% Asist. Global', key: 'global_pct', width: 15 }
  ];

  estilizarEncabezado(ws, 'FF0284C7'); // Azul Cian Profesional

  const munFechaMap = {};

  reportes.forEach(r => {
    const muns = Array.isArray(r.municipio) ? r.municipio : [r.municipio];
    muns.forEach(m => {
      const munNorm = m ? m.toUpperCase().trim() : 'SIN_MUNICIPIO';
      const f = r.fecha;
      const key = `${munNorm}_${f}`;

      if (!munFechaMap[key]) {
        const dt = new Date(f + 'T00:00:00');
        munFechaMap[key] = {
          municipio: munNorm,
          fecha: f,
          dia: DIAS_SEMANA[dt.getDay()],
          instituciones: new Set(),
          estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0
        };
      }

      const instKey = r.institucion_id || r.nombre_institucion?.trim().toUpperCase();
      if (instKey) munFechaMap[key].instituciones.add(instKey);

      munFechaMap[key].estA += r.matricula_asistente || 0;
      munFechaMap[key].estI += r.matricula_inasistente || 0;
      munFechaMap[key].docA += r.docentes_asistente || 0;
      munFechaMap[key].docI += r.docentes_inasistente || 0;
      munFechaMap[key].admA += r.admin_asistente || 0;
      munFechaMap[key].admI += r.admin_inasistente || 0;
      munFechaMap[key].obrA += r.obrero_asistente || 0;
      munFechaMap[key].obrI += r.obrero_inasistente || 0;
      munFechaMap[key].cocA += r.cocina_asistente || 0;
      munFechaMap[key].cocI += r.cocina_inasistente || 0;
    });
  });

  const listado = Object.values(munFechaMap).sort((a, b) => {
    if (a.municipio !== b.municipio) return a.municipio.localeCompare(b.municipio);
    return a.fecha.localeCompare(b.fecha);
  });

  listado.forEach(item => {
    const estTotal = item.estA + item.estI;
    const estPct = estTotal > 0 ? `${((item.estA / estTotal) * 100).toFixed(1)}%` : '0.0%';

    const pAsist = item.docA + item.admA + item.obrA + item.cocA;
    const pInasist = item.docI + item.admI + item.obrI + item.cocI;
    const pTotal = pAsist + pInasist;
    const pPct = pTotal > 0 ? `${((pAsist / pTotal) * 100).toFixed(1)}%` : '0.0%';

    const gTotal = estTotal + pTotal;
    const gAsist = item.estA + pAsist;
    const gPct = gTotal > 0 ? `${((gAsist / gTotal) * 100).toFixed(1)}%` : '0.0%';

    const row = ws.addRow({
      municipio: item.municipio,
      fecha: item.fecha,
      dia: item.dia,
      inst_count: item.instituciones.size,
      est_asist: item.estA,
      est_inasist: item.estI,
      est_total: estTotal,
      est_pct: estPct,
      doc_asist: item.docA,
      doc_inasist: item.docI,
      pers_asist: pAsist,
      pers_inasist: pInasist,
      pers_total: pTotal,
      pers_pct: pPct,
      global_pct: gPct
    });

    row.height = 20;
    row.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });

  ws.autoFilter = { from: 'A1', to: 'O1' };
};

// 6. NUEVO: Resumen por Turno Desglosado por Municipio (Municipio x Turno)
const agregarHojaTurnoPorMunicipio = (wb, reportes) => {
  const ws = wb.addWorksheet('TURNO POR MUNICIPIO');
  ws.columns = [
    { header: 'Municipio', key: 'municipio', width: 20 },
    { header: 'Turno', key: 'turno', width: 14 },
    { header: 'Inst. Reportadas', key: 'inst_count', width: 17 },
    { header: 'Est. Asist.', key: 'est_asist', width: 13 },
    { header: 'Est. Inasist.', key: 'est_inasist', width: 14 },
    { header: 'Total Est.', key: 'est_total', width: 13 },
    { header: '% Asist. Est.', key: 'est_pct', width: 14 },
    { header: 'Doc. Asist.', key: 'doc_asist', width: 13 },
    { header: 'Doc. Inasist.', key: 'doc_inasist', width: 14 },
    { header: 'Total Pers. Asist.', key: 'pers_asist', width: 17 },
    { header: 'Total Pers. Inasist.', key: 'pers_inasist', width: 18 },
    { header: 'Total Personal', key: 'pers_total', width: 15 },
    { header: '% Asist. Pers.', key: 'pers_pct', width: 14 },
    { header: '% Asist. Global', key: 'global_pct', width: 15 }
  ];

  estilizarEncabezado(ws, 'FF6366F1'); // Índigo / Violeta

  const munTurnoMap = {};

  reportes.forEach(r => {
    const muns = Array.isArray(r.municipio) ? r.municipio : [r.municipio];
    muns.forEach(m => {
      const munNorm = m ? m.toUpperCase().trim() : 'SIN_MUNICIPIO';
      const t = r.turno === 'TARDE' ? 'TARDE' : 'MAÑANA';
      const key = `${munNorm}_${t}`;

      if (!munTurnoMap[key]) {
        munTurnoMap[key] = {
          municipio: munNorm,
          turno: t,
          instituciones: new Set(),
          estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0
        };
      }

      const instKey = r.institucion_id || r.nombre_institucion?.trim().toUpperCase();
      if (instKey) munTurnoMap[key].instituciones.add(instKey);

      munTurnoMap[key].estA += r.matricula_asistente || 0;
      munTurnoMap[key].estI += r.matricula_inasistente || 0;
      munTurnoMap[key].docA += r.docentes_asistente || 0;
      munTurnoMap[key].docI += r.docentes_inasistente || 0;
      munTurnoMap[key].admA += r.admin_asistente || 0;
      munTurnoMap[key].admI += r.admin_inasistente || 0;
      munTurnoMap[key].obrA += r.obrero_asistente || 0;
      munTurnoMap[key].obrI += r.obrero_inasistente || 0;
      munTurnoMap[key].cocA += r.cocina_asistente || 0;
      munTurnoMap[key].cocI += r.cocina_inasistente || 0;
    });
  });

  const listado = Object.values(munTurnoMap).sort((a, b) => {
    if (a.municipio !== b.municipio) return a.municipio.localeCompare(b.municipio);
    return a.turno.localeCompare(b.turno);
  });

  listado.forEach(item => {
    const estTotal = item.estA + item.estI;
    const estPct = estTotal > 0 ? `${((item.estA / estTotal) * 100).toFixed(1)}%` : '0.0%';

    const pAsist = item.docA + item.admA + item.obrA + item.cocA;
    const pInasist = item.docI + item.admI + item.obrI + item.cocI;
    const pTotal = pAsist + pInasist;
    const pPct = pTotal > 0 ? `${((pAsist / pTotal) * 100).toFixed(1)}%` : '0.0%';

    const gTotal = estTotal + pTotal;
    const gAsist = item.estA + pAsist;
    const gPct = gTotal > 0 ? `${((gAsist / gTotal) * 100).toFixed(1)}%` : '0.0%';

    const row = ws.addRow({
      municipio: item.municipio,
      turno: item.turno,
      inst_count: item.instituciones.size,
      est_asist: item.estA,
      est_inasist: item.estI,
      est_total: estTotal,
      est_pct: estPct,
      doc_asist: item.docA,
      doc_inasist: item.docI,
      pers_asist: pAsist,
      pers_inasist: pInasist,
      pers_total: pTotal,
      pers_pct: pPct,
      global_pct: gPct
    });

    row.height = 20;
    row.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });

  ws.autoFilter = { from: 'A1', to: 'N1' };
};

// 7. NUEVO: Resumen Semanal Desglosado por Municipio (Municipio x Semana)
const agregarHojaSemanalPorMunicipio = (wb, reportes) => {
  const ws = wb.addWorksheet('SEMANAL POR MUNICIPIO');
  ws.columns = [
    { header: 'Municipio', key: 'municipio', width: 20 },
    { header: 'Semana Calendario', key: 'semana', width: 34 },
    { header: 'Días con Registro', key: 'dias_count', width: 17 },
    { header: 'Inst. Reportadas', key: 'inst_count', width: 17 },
    { header: 'Est. Asist.', key: 'est_asist', width: 13 },
    { header: 'Est. Inasist.', key: 'est_inasist', width: 14 },
    { header: 'Total Est.', key: 'est_total', width: 13 },
    { header: '% Asist. Est.', key: 'est_pct', width: 14 },
    { header: 'Total Pers. Asist.', key: 'pers_asist', width: 17 },
    { header: 'Total Pers. Inasist.', key: 'pers_inasist', width: 18 },
    { header: 'Total Personal', key: 'pers_total', width: 15 },
    { header: '% Asist. Pers.', key: 'pers_pct', width: 14 },
    { header: '% Asist. Global', key: 'global_pct', width: 15 }
  ];

  estilizarEncabezado(ws, 'FF16A34A'); // Verde Intenso

  const munSemanaMap = {};

  reportes.forEach(r => {
    const semInfo = getSemanaInfo(r.fecha);
    const muns = Array.isArray(r.municipio) ? r.municipio : [r.municipio];

    muns.forEach(m => {
      const munNorm = m ? m.toUpperCase().trim() : 'SIN_MUNICIPIO';
      const key = `${munNorm}_${semInfo.clave}`;

      if (!munSemanaMap[key]) {
        munSemanaMap[key] = {
          municipio: munNorm,
          semana: semInfo.label,
          clave: semInfo.clave,
          dias: new Set(),
          instituciones: new Set(),
          estA: 0, estI: 0, docA: 0, docI: 0, admA: 0, admI: 0, obrA: 0, obrI: 0, cocA: 0, cocI: 0
        };
      }

      munSemanaMap[key].dias.add(r.fecha);
      const instKey = r.institucion_id || r.nombre_institucion?.trim().toUpperCase();
      if (instKey) munSemanaMap[key].instituciones.add(instKey);

      munSemanaMap[key].estA += r.matricula_asistente || 0;
      munSemanaMap[key].estI += r.matricula_inasistente || 0;
      munSemanaMap[key].docA += r.docentes_asistente || 0;
      munSemanaMap[key].docI += r.docentes_inasistente || 0;
      munSemanaMap[key].admA += r.admin_asistente || 0;
      munSemanaMap[key].admI += r.admin_inasistente || 0;
      munSemanaMap[key].obrA += r.obrero_asistente || 0;
      munSemanaMap[key].obrI += r.obrero_inasistente || 0;
      munSemanaMap[key].cocA += r.cocina_asistente || 0;
      munSemanaMap[key].cocI += r.cocina_inasistente || 0;
    });
  });

  const listado = Object.values(munSemanaMap).sort((a, b) => {
    if (a.municipio !== b.municipio) return a.municipio.localeCompare(b.municipio);
    return a.clave.localeCompare(b.clave);
  });

  listado.forEach(item => {
    const estTotal = item.estA + item.estI;
    const estPct = estTotal > 0 ? `${((item.estA / estTotal) * 100).toFixed(1)}%` : '0.0%';

    const pAsist = item.docA + item.admA + item.obrA + item.cocA;
    const pInasist = item.docI + item.admI + item.obrI + item.cocI;
    const pTotal = pAsist + pInasist;
    const pPct = pTotal > 0 ? `${((pAsist / pTotal) * 100).toFixed(1)}%` : '0.0%';

    const gTotal = estTotal + pTotal;
    const gAsist = item.estA + pAsist;
    const gPct = gTotal > 0 ? `${((gAsist / gTotal) * 100).toFixed(1)}%` : '0.0%';

    const row = ws.addRow({
      municipio: item.municipio,
      semana: item.semana,
      dias_count: item.dias.size,
      inst_count: item.instituciones.size,
      est_asist: item.estA,
      est_inasist: item.estI,
      est_total: estTotal,
      est_pct: estPct,
      pers_asist: pAsist,
      pers_inasist: pInasist,
      pers_total: pTotal,
      pers_pct: pPct,
      global_pct: gPct
    });

    row.height = 20;
    row.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });

  ws.autoFilter = { from: 'A1', to: 'M1' };
};

// 8. Hoja de Instituciones Sin Reportar
const agregarHojaNoReportadas = (wb, noReportadas, nombreHoja = 'INSTITUCIONES SIN REPORTAR') => {
  const ws = wb.addWorksheet(nombreHoja.substring(0, 31));
  ws.columns = [
    { header: 'Municipio', key: 'municipio', width: 22 },
    { header: 'Nombre de la Institución', key: 'nombre', width: 45 },
    { header: 'Código DEA / Plantel', key: 'codigo', width: 20 },
    { header: 'Turno Oficial', key: 'turno', width: 15 },
    { header: 'Matrícula Esperada', key: 'max_matricula', width: 18 },
    { header: 'Docentes Esperados', key: 'max_docentes', width: 18 },
    { header: 'Estado', key: 'estado', width: 25 }
  ];

  estilizarEncabezado(ws, 'FFB91C1C');

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
      fgColor: { argb: 'FFFEE2E2' }
    };
    row.getCell('estado').font = {
      color: { argb: 'FF991B1B' },
      bold: true,
      size: 10
    };
  });

  ws.autoFilter = { from: 'A1', to: 'G1' };
};

// 9. NUEVO: Hoja Integral de un Municipio (Resumen Ejecutivo + Turnos + Diario + Semanal + Pendientes + Detalle)
const generarHojaCompletaMunicipio = (wb, mun, reportesMun, institucionesMun, noReportadasMun) => {
  const ws = wb.addWorksheet(mun.substring(0, 31));

  // Configuración de anchos iniciales
  ws.columns = [
    { key: 'c1', width: 22 },
    { key: 'c2', width: 22 },
    { key: 'c3', width: 20 },
    { key: 'c4', width: 36 },
    { key: 'c5', width: 16 },
    { key: 'c6', width: 14 },
    { key: 'c7', width: 14 },
    { key: 'c8', width: 14 },
    { key: 'c9', width: 14 },
    { key: 'c10', width: 14 },
    { key: 'c11', width: 14 },
    { key: 'c12', width: 14 },
    { key: 'c13', width: 14 },
    { key: 'c14', width: 16 },
    { key: 'c15', width: 35 }
  ];

  // 1. Banner Principal del Municipio
  const rowT1 = ws.addRow(['CDCE ESTADAL GUÁRICO - SALA SITUACIONAL']);
  rowT1.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  rowT1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  rowT1.alignment = { horizontal: 'left', vertical: 'middle' };
  rowT1.height = 26;

  const rowT2 = ws.addRow([`INFORME INTEGRAL DE ASISTENCIA - MUNICIPIO: ${mun}`]);
  rowT2.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  rowT2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  rowT2.alignment = { horizontal: 'left', vertical: 'middle' };
  rowT2.height = 22;

  ws.addRow([]); // Espaciador

  // 2. Indicadores Clave del Municipio
  const catTotal = institucionesMun.length;
  const repIds = new Set(reportesMun.map(r => r.institucion_id || r.nombre_institucion?.trim().toUpperCase()).filter(Boolean));
  const repCount = repIds.size;
  const noRepCount = noReportadasMun.length;
  const pctCob = catTotal > 0 ? `${((repCount / catTotal) * 100).toFixed(1)}%` : '--';

  let estA = 0, estI = 0, docA = 0, docI = 0, admA = 0, admI = 0, obrA = 0, obrI = 0, cocA = 0, cocI = 0;
  reportesMun.forEach(r => {
    estA += r.matricula_asistente || 0;
    estI += r.matricula_inasistente || 0;
    docA += r.docentes_asistente || 0;
    docI += r.docentes_inasistente || 0;
    admA += r.admin_asistente || 0;
    admI += r.admin_inasistente || 0;
    obrA += r.obrero_asistente || 0;
    obrI += r.obrero_inasistente || 0;
    cocA += r.cocina_asistente || 0;
    cocI += r.cocina_inasistente || 0;
  });

  const totalEst = estA + estI;
  const pctEst = totalEst > 0 ? `${((estA / totalEst) * 100).toFixed(1)}%` : '0.0%';
  const persA = docA + admA + obrA + cocA;
  const persI = docI + admI + obrI + cocI;
  const persTot = persA + persI;
  const pctPers = persTot > 0 ? `${((persA / persTot) * 100).toFixed(1)}%` : '0.0%';

  const rowKpiHeader = ws.addRow(['INDICADOR GENERAL', 'VALOR REGISTRADO', 'DETALLE ADICIONAL']);
  estilizarEncabezado(ws, 'FF334155', ws.rowCount);

  const kpis = [
    ['Instituciones en Catálogo Oficial', catTotal, 'Total registradas en el sistema'],
    ['Instituciones que Reportaron', repCount, `Cobertura institucional: ${pctCob}`],
    ['Instituciones Faltantes (Sin Reportar)', noRepCount, 'Planteles pendientes por consignar'],
    ['Total Reportes Generados', reportesMun.length, 'Formularios recibidos'],
    ['Estudiantes Asistentes', estA.toLocaleString('es-VE'), `Asistencia: ${pctEst} (Inasistentes: ${estI.toLocaleString('es-VE')})`],
    ['Total Personal Asistente', persA.toLocaleString('es-VE'), `Asistencia: ${pctPers} (Doc, Adm, Obr, Coc)`]
  ];

  kpis.forEach(k => {
    const r = ws.addRow(k);
    r.height = 19;
    r.getCell(1).font = { bold: true, color: { argb: 'FF1E293B' } };
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(2).font = { bold: true, color: { argb: 'FF1D4ED8' } };
    r.getCell(3).font = { italic: true, color: { argb: 'FF64748B' } };
  });

  ws.addRow([]); // Espaciador

  // 3. Resumen por Turno en el Municipio
  const rowTurnoHeader = ws.addRow([`--- RESUMEN POR TURNO EN ${mun} ---`]);
  rowTurnoHeader.font = { bold: true, size: 10, color: { argb: 'FF4338CA' } };

  const thRow = ws.addRow(['Turno', 'Reportes', 'Est. Asist.', 'Est. Inasist.', 'Total Est.', '% Asist. Est.', 'Pers. Asist.', 'Pers. Inasist.', '% Asist. Pers.']);
  estilizarEncabezado(ws, 'FF4F46E5', ws.rowCount);

  ['MAÑANA', 'TARDE'].forEach(t => {
    const repsTurno = reportesMun.filter(r => r.turno === t);
    let tEstA = 0, tEstI = 0, tDocA = 0, tDocI = 0, tAdmA = 0, tAdmI = 0, tObrA = 0, tObrI = 0, tCocA = 0, tCocI = 0;
    repsTurno.forEach(r => {
      tEstA += r.matricula_asistente || 0;
      tEstI += r.matricula_inasistente || 0;
      tDocA += r.docentes_asistente || 0;
      tDocI += r.docentes_inasistente || 0;
      tAdmA += r.admin_asistente || 0;
      tAdmI += r.admin_inasistente || 0;
      tObrA += r.obrero_asistente || 0;
      tObrI += r.obrero_inasistente || 0;
      tCocA += r.cocina_asistente || 0;
      tCocI += r.cocina_inasistente || 0;
    });

    const totE = tEstA + tEstI;
    const pctE = totE > 0 ? `${((tEstA / totE) * 100).toFixed(1)}%` : '0.0%';
    const tPersA = tDocA + tAdmA + tObrA + tCocA;
    const tPersI = tDocI + tAdmI + tObrI + tCocI;
    const totP = tPersA + tPersI;
    const pctP = totP > 0 ? `${((tPersA / totP) * 100).toFixed(1)}%` : '0.0%';

    const r = ws.addRow([t, repsTurno.length, tEstA, tEstI, totE, pctE, tPersA, tPersI, pctP]);
    r.height = 19;
    r.eachCell(c => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
  });

  ws.addRow([]); // Espaciador

  // 4. Planteles Pendientes por Reportar en este Municipio
  if (noReportadasMun.length > 0) {
    const rowNoRepHeader = ws.addRow([`--- INSTITUCIONES QUE NO HAN REPORTADO EN ${mun} (${noReportadasMun.length}) ---`]);
    rowNoRepHeader.font = { bold: true, size: 10, color: { argb: 'FFB91C1C' } };

    const nrhRow = ws.addRow(['Nombre de la Institución', 'Código DEA', 'Turno Oficial', 'Matrícula Esperada', 'Docentes Esperados', 'Estado']);
    estilizarEncabezado(ws, 'FFB91C1C', ws.rowCount);

    noReportadasMun.forEach(inst => {
      const r = ws.addRow([
        inst.nombre,
        inst.codigo || 'S/C',
        inst.turno || 'AMBOS',
        inst.max_matricula || 0,
        inst.max_docentes || 0,
        '⚠️ PENDIENTE POR REPORTAR'
      ]);
      r.height = 19;
      r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      r.getCell(6).font = { color: { argb: 'FF991B1B' }, bold: true };
    });

    ws.addRow([]); // Espaciador
  }

  // 5. Registros Detallados de Asistencia
  const rowDetalleHeader = ws.addRow([`--- REGISTROS DETALLADOS DE ASISTENCIA EN ${mun} (${reportesMun.length}) ---`]);
  rowDetalleHeader.font = { bold: true, size: 10, color: { argb: 'FF1D4ED8' } };

  const rdRow = ws.addRow([
    'Turno', 'Fecha', 'Institución', 'Manual', 'Director(a)', 'Cédula', 'Teléfono',
    'Est. Asist.', 'Est. Inasist.', '% Asistencia', 'Doc. Asist.', 'Adm. Asist.', 'Obr. Asist.', 'Coc. Asist.', 'Hora / Incidencias'
  ]);
  estilizarEncabezado(ws, 'FF1E3A8A', ws.rowCount);

  reportesMun.forEach(rep => {
    const tEst = (rep.matricula_asistente || 0) + (rep.matricula_inasistente || 0);
    const pEst = tEst > 0 ? `${(((rep.matricula_asistente || 0) / tEst) * 100).toFixed(1)}%` : '0.0%';

    const r = ws.addRow([
      rep.turno,
      rep.fecha,
      rep.nombre_institucion,
      rep.es_institucion_manual ? 'SÍ' : 'NO',
      rep.nombre_director,
      rep.cedula,
      rep.telefono,
      rep.matricula_asistente || 0,
      rep.matricula_inasistente || 0,
      pEst,
      rep.docentes_asistente || 0,
      rep.admin_asistente || 0,
      rep.obrero_asistente || 0,
      rep.cocina_asistente || 0,
      rep.incidencias || '--'
    ]);

    r.height = 20;
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(12).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(13).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(14).alignment = { horizontal: 'center', vertical: 'middle' };
  });
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

    const munNormalizado = municipio ? municipio.toUpperCase().trim() : null;
    if (munNormalizado) {
      where.municipio = { [Op.contains]: [munNormalizado] };
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

    // Calcular planteles que NO han reportado en el período
    const reportedIds = new Set(reportes.map(r => r.institucion_id).filter(Boolean));
    const reportedNames = new Set(reportes.map(r => r.nombre_institucion ? r.nombre_institucion.trim().toUpperCase() : '').filter(Boolean));

    const noReportadas = todasInstituciones.filter(inst => {
      if (munNormalizado && inst.municipio !== munNormalizado) return false;
      if (turno && ['MAÑANA', 'TARDE'].includes(turno) && !['AMBOS', turno].includes(inst.turno)) return false;
      if (inst.id && reportedIds.has(inst.id)) return false;
      if (inst.nombre && reportedNames.has(inst.nombre.trim().toUpperCase())) return false;
      return true;
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sala Situacional CDCE ESTADAL GUÁRICO';
    wb.created = new Date();

    // =========================================================================
    // CASO A: Exportación filtrada para UN MUNICIPIO ESPECÍFICO
    // =========================================================================
    if (munNormalizado) {
      wb.title = `Informe y Resumen de Asistencia - Municipio ${munNormalizado} - CDCE GUÁRICO`;

      // 1. Resumen Diario del Municipio
      agregarHojaResumenDiario(wb, reportes, `DIARIO - ${munNormalizado}`);

      // 2. Resumen por Turno del Municipio
      agregarHojaResumenTurno(wb, reportes, `TURNO - ${munNormalizado}`);

      // 3. Resumen Semanal del Municipio
      agregarHojaResumenSemanal(wb, reportes, `SEMANAL - ${munNormalizado}`);

      // 4. Planteles que NO han reportado en este Municipio
      agregarHojaNoReportadas(wb, noReportadas, `SIN REPORTAR - ${munNormalizado}`);

      // 5. Registros Detallados del Municipio
      const wsDetalleMun = wb.addWorksheet(`DETALLE - ${munNormalizado}`.substring(0, 31));
      aplicarEstilosHojaDetalle(wsDetalleMun, reportes);

      const filename = `Reporte_Resumen_${munNormalizado}_${desde || 'inicio'}_al_${hasta || 'cierre'}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await wb.xlsx.write(res);
      return res.end();
    }

    // =========================================================================
    // CASO B: Exportación ESTADAL COMPLETA (Con desglose por Municipio)
    // =========================================================================
    wb.title = 'Informe Integral y Resumen de Asistencia Escolar - CDCE ESTADAL GUÁRICO';

    // 1. Resumen Diario Estadal
    agregarHojaResumenDiario(wb, reportes, 'RESUMEN DIARIO ESTADAL');

    // 2. Resumen por Turno Estadal
    agregarHojaResumenTurno(wb, reportes, 'RESUMEN TURNO ESTADAL');

    // 3. Resumen Semanal Estadal
    agregarHojaResumenSemanal(wb, reportes, 'RESUMEN SEMANAL ESTADAL');

    // 4. Resumen por Municipio (15 municipios consolidado)
    agregarHojaResumenMunicipio(wb, reportes, todasInstituciones);

    // 5. NUEVO: Resumen Diario Desglosado por Municipio (Municipio x Día)
    agregarHojaDiarioPorMunicipio(wb, reportes);

    // 6. NUEVO: Resumen por Turno Desglosado por Municipio (Municipio x Turno)
    agregarHojaTurnoPorMunicipio(wb, reportes);

    // 7. NUEVO: Resumen Semanal Desglosado por Municipio (Municipio x Semana)
    agregarHojaSemanalPorMunicipio(wb, reportes);

    // 8. Planteles que NO han reportado a nivel Estadal
    agregarHojaNoReportadas(wb, noReportadas, 'INSTITUCIONES SIN REPORTAR');

    // 9. Consolidado Detallado General de todos los reportes
    const wsGeneral = wb.addWorksheet('CONSOLIDADO GENERAL');
    aplicarEstilosHojaDetalle(wsGeneral, reportes);

    // 10. Hojas Integrales para CADA UNO de los 15 MUNICIPIOS
    MUNICIPIOS.forEach(mun => {
      const repMun = reportes.filter(r => Array.isArray(r.municipio) ? r.municipio.includes(mun) : r.municipio === mun);
      const instMun = todasInstituciones.filter(i => i.municipio === mun);
      const noRepMun = noReportadas.filter(i => i.municipio === mun);

      // Si el municipio tiene reportes o instituciones en catálogo, generamos su hoja integral
      if (repMun.length > 0 || instMun.length > 0) {
        generarHojaCompletaMunicipio(wb, mun, repMun, instMun, noRepMun);
      }
    });

    // 11. Hoja separada para Instituciones Manuales (si existen)
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
