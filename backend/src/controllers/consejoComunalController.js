const { RegistroConsejoComunal, PadronPersonal, sequelize } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const ss = require('simple-statistics');

// Regex de validación estricta
const REGEX_CEDULA = /^\d{6,8}$/;
const REGEX_TELEFONO = /^(0412|0414|0424|0416|0426)\d{7}$/;
const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,100}$/;

const sanitizarTexto = (texto) => {
  if (typeof texto !== 'string') return '';
  return texto
    .trim()
    .replace(/[<>]/g, '') // Prevención XSS básica
    .replace(/\s+/g, ' ');
};

/**
 * POST /api/consejos-comunales
 * Registro institucional público (Mobile-First) - CERRADO INDEFINIDAMENTE
 */
exports.crearRegistro = async (req, res) => {
  return res.status(403).json({
    error: 'El proceso de registro de consejos comunales ha finalizado y se encuentra cerrado indefinidamente por disposición de la Sala Situacional.'
  });
};

exports.crearRegistroOriginal = async (req, res) => {
  try {
    const {
      nacionalidad = 'V',
      cedula,
      nombres_apellidos,
      telefono,
      genero,
      edad,
      tipo_personal,
      institucion_educativa,
      municipio,
      parroquia,
      comunidad,
      circuito_comunal,
      comuna,
      participa_asambleas,
      forma_parte_comite,
      comite
    } = req.body;

    // 1. Validaciones de Datos Personales
    if (!['V', 'E'].includes(nacionalidad)) {
      return res.status(400).json({ error: 'Nacionalidad inválida. Debe ser V o E.' });
    }

    const cleanCedula = String(cedula || '').trim();
    if (!REGEX_CEDULA.test(cleanCedula)) {
      return res.status(400).json({
        error: 'La cédula debe ser numérica y contener entre 6 y 8 dígitos.'
      });
    }

    const cleanNombres = sanitizarTexto(nombres_apellidos);
    if (!REGEX_NOMBRE.test(cleanNombres)) {
      return res.status(400).json({
        error: 'Nombres y Apellidos inválidos. Use solo letras (mínimo 3, máximo 100 caracteres).'
      });
    }

    const cleanTelefono = String(telefono || '').trim().replace(/\D/g, '');
    if (!REGEX_TELEFONO.test(cleanTelefono)) {
      return res.status(400).json({
        error: 'Teléfono inválido. Ingrese un prefijo venezolano (0412, 0414, 0424, 0416, 0426) con 7 dígitos.'
      });
    }

    // Validación de Género y Edad
    let cleanGenero = null;
    if (genero) {
      const g = sanitizarTexto(genero);
      if (!['Hombre', 'Mujer'].includes(g)) {
        return res.status(400).json({ error: 'Género no válido. Debe seleccionar Hombre o Mujer.' });
      }
      cleanGenero = g;
    } else {
      return res.status(400).json({ error: 'El género es un campo obligatorio (Hombre o Mujer).' });
    }

    let cleanEdad = null;
    if (edad !== undefined && edad !== null && edad !== '') {
      const parsedEdad = parseInt(edad, 10);
      if (isNaN(parsedEdad) || parsedEdad < 15 || parsedEdad > 100) {
        return res.status(400).json({ error: 'La edad debe ser un número entero entre 15 y 100 años.' });
      }
      cleanEdad = parsedEdad;
    } else {
      return res.status(400).json({ error: 'La edad es un campo obligatorio.' });
    }

    // 2. Validación de Tipo de Personal
    let personalValor = '';
    let personalDetalle = null;

    if (typeof tipo_personal === 'object' && tipo_personal !== null) {
      personalValor = sanitizarTexto(tipo_personal.valor);
      personalDetalle = tipo_personal.detalle ? sanitizarTexto(tipo_personal.detalle) : null;
    } else {
      personalValor = sanitizarTexto(tipo_personal);
    }

    if (!personalValor) {
      return res.status(400).json({ error: 'Debe especificar el tipo de personal.' });
    }

    if (personalValor === 'Otro' && (!personalDetalle || personalDetalle.length < 3)) {
      return res.status(400).json({
        error: 'Debe especificar el detalle de su tipo de personal.'
      });
    }

    // 3. Validación de Ubicación Geográfica
    const cleanMunicipio = sanitizarTexto(municipio);
    const cleanParroquia = sanitizarTexto(parroquia);
    const cleanComunidad = sanitizarTexto(comunidad);

    if (!cleanMunicipio || !cleanParroquia || !cleanComunidad) {
      return res.status(400).json({
        error: 'Municipio, Parroquia y Nombre de la Comunidad son campos obligatorios.'
      });
    }

    // 4. Validación de Participación y Comités
    const participaAsambleasBool = Boolean(participa_asambleas);
    const formaParteComiteBool = Boolean(forma_parte_comite);

    let comiteValor = null;
    let comiteDetalle = null;

    if (formaParteComiteBool) {
      if (typeof comite === 'object' && comite !== null) {
        comiteValor = sanitizarTexto(comite.valor);
        comiteDetalle = comite.detalle ? sanitizarTexto(comite.detalle) : null;
      } else {
        comiteValor = sanitizarTexto(comite);
      }

      if (!comiteValor) {
        return res.status(400).json({
          error: 'Debe seleccionar el comité o vocería al que pertenece.'
        });
      }

      if (comiteValor.includes('Otro') && (!comiteDetalle || comiteDetalle.length < 3)) {
        return res.status(400).json({
          error: 'Debe especificar el nombre del comité / vocería en el campo Otro.'
        });
      }
    }

    // 5. Verificación de Duplicados (Unicidad Nacionalidad + Cédula)
    const existente = await RegistroConsejoComunal.findOne({
      where: {
        nacionalidad,
        cedula: cleanCedula
      }
    });

    if (existente) {
      return res.status(409).json({
        error: `La cédula ${nacionalidad}-${cleanCedula} ya se encuentra registrada en el sistema.`
      });
    }

    // 6. Obtención de IP
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    // 7. Persistencia con recuperación automática ante triggers residuales
    let nuevoRegistro;
    const registroPayload = {
      nacionalidad,
      cedula: cleanCedula,
      nombres_apellidos: cleanNombres,
      telefono: cleanTelefono,
      genero: cleanGenero,
      edad: cleanEdad,
      tipo_personal: personalValor,
      tipo_personal_detalle: personalDetalle,
      institucion_educativa: sanitizarTexto(institucion_educativa) || null,
      municipio: cleanMunicipio,
      parroquia: cleanParroquia,
      comunidad: cleanComunidad,
      circuito_comunal: circuito_comunal ? sanitizarTexto(circuito_comunal) : null,
      comuna: comuna ? sanitizarTexto(comuna) : null,
      participa_asambleas: participaAsambleasBool,
      forma_parte_comite: formaParteComiteBool,
      comite: comiteValor,
      comite_detalle: comiteDetalle,
      ip_registro: clientIp
    };

    try {
      nuevoRegistro = await RegistroConsejoComunal.create(registroPayload);
    } catch (createErr) {
      const isTriggerError =
        createErr.message?.includes('createdAt') ||
        createErr.message?.includes('trg_sync_comunales_timestamps') ||
        createErr.original?.message?.includes('createdAt') ||
        createErr.original?.message?.includes('trg_sync_comunales_timestamps');

      if (isTriggerError) {
        console.warn('⚠️ Detectado trigger defectuoso en Postgres. Purgando y reintentando inserción...');
        try {
          await sequelize.query('DROP TRIGGER IF EXISTS sync_timestamps_comunales ON registros_consejos_comunales CASCADE;');
          await sequelize.query('DROP TRIGGER IF EXISTS sync_timestamps_padron ON padron_personal_educativo CASCADE;');
          await sequelize.query('DROP FUNCTION IF EXISTS trg_sync_comunales_timestamps() CASCADE;');
        } catch (dropErr) {
          console.error('Error al purgar trigger defectuoso:', dropErr.message);
        }
        nuevoRegistro = await RegistroConsejoComunal.create(registroPayload);
      } else {
        throw createErr;
      }
    }

    // 8. Sincronización en PadronPersonal (Padrón Electoral / Institucional)
    try {
      await PadronPersonal.upsert({
        nacionalidad,
        cedula: cleanCedula,
        nombres_apellidos: cleanNombres,
        tipo_personal: personalValor || 'Docente',
        municipio: cleanMunicipio
      });
    } catch (padronErr) {
      console.warn('Advertencia al sincronizar con PadronPersonal:', padronErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Registro comunal institucional guardado exitosamente.',
      registro: {
        id: nuevoRegistro.id,
        nacionalidad: nuevoRegistro.nacionalidad,
        cedula: nuevoRegistro.cedula,
        nombres_apellidos: nuevoRegistro.nombres_apellidos,
        genero: nuevoRegistro.genero,
        edad: nuevoRegistro.edad,
        municipio: nuevoRegistro.municipio,
        parroquia: nuevoRegistro.parroquia,
        createdAt: nuevoRegistro.created_at || nuevoRegistro.createdAt
      }
    });
  } catch (error) {
    console.error('Error al registrar participación comunal:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al procesar el registro.'
    });
  }
};

/**
 * GET /api/consejos-comunales/stats
 * Estadísticas consolidadas, descriptivas y comparativas multidimensionales
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const totalRegistros = await RegistroConsejoComunal.count();
    const conComite = await RegistroConsejoComunal.count({ where: { forma_parte_comite: true } });
    const enAsambleas = await RegistroConsejoComunal.count({ where: { participa_asambleas: true } });

    // Cuadrantes de compromiso
    const ambos = await RegistroConsejoComunal.count({
      where: { forma_parte_comite: true, participa_asambleas: true }
    });
    const soloAsamblea = await RegistroConsejoComunal.count({
      where: { forma_parte_comite: false, participa_asambleas: true }
    });
    const soloComite = await RegistroConsejoComunal.count({
      where: { forma_parte_comite: true, participa_asambleas: false }
    });
    const pasivo = await RegistroConsejoComunal.count({
      where: { forma_parte_comite: false, participa_asambleas: false }
    });

    // Estadísticas descriptivas de edad usando simple-statistics
    const registrosEdad = await RegistroConsejoComunal.findAll({
      attributes: ['edad'],
      where: {
        edad: { [Op.ne]: null }
      },
      raw: true
    });

    const edades = registrosEdad
      .map((r) => Number(r.edad))
      .filter((e) => !isNaN(e) && e > 0);

    let estadisticasEdad = {
      media: 0,
      mediana: 0,
      desviacionEstandar: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      totalMuestra: edades.length
    };

    if (edades.length > 0) {
      estadisticasEdad = {
        media: Number(ss.mean(edades).toFixed(1)),
        mediana: Number(ss.median(edades).toFixed(1)),
        desviacionEstandar: edades.length > 1 ? Number(ss.standardDeviation(edades).toFixed(1)) : 0,
        min: ss.min(edades),
        max: ss.max(edades),
        q1: Number(ss.quantile(edades, 0.25).toFixed(1)),
        q3: Number(ss.quantile(edades, 0.75).toFixed(1)),
        totalMuestra: edades.length
      };
    }

    // Rangos etarios comparativos
    const rangosEdad = await RegistroConsejoComunal.findAll({
      attributes: [
        [
          sequelize.literal(`CASE 
            WHEN edad BETWEEN 15 AND 29 THEN '15-29 (Juventud)' 
            WHEN edad BETWEEN 30 AND 45 THEN '30-45 (Adulto Joven)' 
            WHEN edad BETWEEN 46 AND 59 THEN '46-59 (Adulto Maduro)' 
            WHEN edad >= 60 THEN '60+ (Adulto Mayor)' 
            ELSE 'No especificado' END`),
          'rango'
        ],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal("COUNT(CASE WHEN forma_parte_comite = true THEN 1 END)"), 'con_comite'],
        [sequelize.literal("COUNT(CASE WHEN participa_asambleas = true THEN 1 END)"), 'en_asambleas']
      ],
      group: ['rango'],
      order: [[sequelize.literal('total'), 'DESC']],
      raw: true
    });

    // Comparativa por Género
    const porGenero = await RegistroConsejoComunal.findAll({
      attributes: [
        'genero',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal("COUNT(CASE WHEN forma_parte_comite = true THEN 1 END)"), 'con_comite'],
        [sequelize.literal("COUNT(CASE WHEN participa_asambleas = true THEN 1 END)"), 'en_asambleas']
      ],
      where: {
        genero: { [Op.ne]: null }
      },
      group: ['genero'],
      order: [[sequelize.literal('total'), 'DESC']],
      raw: true
    });

    // Comparativa por Tipo de Personal
    const porTipoPersonal = await RegistroConsejoComunal.findAll({
      attributes: [
        'tipo_personal',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal("COUNT(CASE WHEN forma_parte_comite = true THEN 1 END)"), 'con_comite'],
        [sequelize.literal("COUNT(CASE WHEN participa_asambleas = true THEN 1 END)"), 'en_asambleas']
      ],
      group: ['tipo_personal'],
      order: [[sequelize.literal('total'), 'DESC']],
      raw: true
    });

    // Comparativa Territorial Municipal
    const porMunicipio = await RegistroConsejoComunal.findAll({
      attributes: [
        'municipio',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal("COUNT(CASE WHEN forma_parte_comite = true THEN 1 END)"), 'con_comite'],
        [sequelize.literal("COUNT(CASE WHEN participa_asambleas = true THEN 1 END)"), 'en_asambleas']
      ],
      group: ['municipio'],
      order: [[sequelize.literal('total'), 'DESC']],
      raw: true
    });

    // Top Comités / Vocerías más representadas
    const porComite = await RegistroConsejoComunal.findAll({
      attributes: [
        'comite',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      where: {
        forma_parte_comite: true,
        comite: { [Op.ne]: null }
      },
      group: ['comite'],
      order: [[sequelize.literal('total'), 'DESC']],
      limit: 15,
      raw: true
    });

    // Top 10 Instituciones Educativas con mayor activación
    const topInstituciones = await RegistroConsejoComunal.findAll({
      attributes: [
        'institucion_educativa',
        'municipio',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal("COUNT(CASE WHEN forma_parte_comite = true THEN 1 END)"), 'con_comite']
      ],
      where: {
        institucion_educativa: { [Op.ne]: null }
      },
      group: ['institucion_educativa', 'municipio'],
      order: [[sequelize.literal('total'), 'DESC']],
      limit: 10,
      raw: true
    });

    // Métricas Territoriales
    const totalComunidades = await RegistroConsejoComunal.count({
      distinct: true,
      col: 'comunidad'
    });
    const totalCircuitos = await RegistroConsejoComunal.count({
      distinct: true,
      col: 'circuito_comunal',
      where: { circuito_comunal: { [Op.ne]: null } }
    });
    const totalComunas = await RegistroConsejoComunal.count({
      distinct: true,
      col: 'comuna',
      where: { comuna: { [Op.ne]: null } }
    });

    return res.json({
      totalRegistros,
      conComite,
      enAsambleas,
      compromiso: {
        pleno: ambos,
        soloAsamblea,
        soloComite,
        pasivo
      },
      estadisticasEdad,
      rangosEdad,
      porMunicipio,
      porTipoPersonal,
      porGenero,
      porComite,
      topInstituciones,
      coberturaTerritorial: {
        municipiosActivos: porMunicipio.length,
        totalComunidades,
        totalCircuitos,
        totalComunas
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas comunales:', error);
    return res.status(500).json({ error: 'Error al consultar estadísticas.' });
  }
};

/**
 * GET /api/consejos-comunales
 * Lista paginada y filtrable para panel administrativo
 */
exports.listarRegistros = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      municipio = '',
      tipo_personal = '',
      forma_parte_comite = '',
      genero = ''
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 15);
    const offset = (parsedPage - 1) * parsedLimit;
    const where = {};

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { cedula: { [Op.iLike]: s } },
        { nombres_apellidos: { [Op.iLike]: s } },
        { comunidad: { [Op.iLike]: s } }
      ];
    }

    if (municipio && String(municipio).trim()) {
      const cleanMun = String(municipio).trim();
      if (cleanMun === 'SANTA MARIA DE IPIRE' || cleanMun === 'SANTA MARIA') {
        where.municipio = { [Op.in]: ['SANTA MARIA DE IPIRE', 'SANTA MARIA'] };
      } else {
        where.municipio = cleanMun;
      }
    }

    if (tipo_personal && String(tipo_personal).trim()) {
      where.tipo_personal = String(tipo_personal).trim();
    }

    if (genero && String(genero).trim()) {
      where.genero = String(genero).trim();
    }

    if (forma_parte_comite !== undefined && forma_parte_comite !== null && String(forma_parte_comite).trim() !== '') {
      where.forma_parte_comite = String(forma_parte_comite) === 'true';
    }

    const { count, rows } = await RegistroConsejoComunal.findAndCountAll({
      where,
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return res.json({
      total: count,
      page: parsedPage,
      totalPages: Math.ceil(count / parsedLimit) || 1,
      data: rows
    });
  } catch (error) {
    console.error('Error al listar registros comunales:', error);
    return res.status(500).json({ error: 'Error al consultar registros de participación comunal.' });
  }
};

/**
 * GET /api/consejos-comunales/export/excel
 * Exportación completa a Excel profesional multi-hoja con comparativas y métricas estadísticas
 */
exports.exportarExcel = async (req, res) => {
  try {
    const { municipio, tipo_personal, search, genero, forma_parte_comite } = req.query;
    const where = {};

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { cedula: { [Op.iLike]: s } },
        { nombres_apellidos: { [Op.iLike]: s } },
        { comunidad: { [Op.iLike]: s } }
      ];
    }

    if (municipio && String(municipio).trim()) {
      const cleanMun = String(municipio).trim();
      if (cleanMun === 'SANTA MARIA DE IPIRE' || cleanMun === 'SANTA MARIA') {
        where.municipio = { [Op.in]: ['SANTA MARIA DE IPIRE', 'SANTA MARIA'] };
      } else {
        where.municipio = cleanMun;
      }
    }

    if (tipo_personal && String(tipo_personal).trim()) {
      where.tipo_personal = String(tipo_personal).trim();
    }

    if (genero && String(genero).trim()) {
      where.genero = String(genero).trim();
    }

    if (forma_parte_comite !== undefined && forma_parte_comite !== null && String(forma_parte_comite).trim() !== '') {
      where.forma_parte_comite = String(forma_parte_comite) === 'true';
    }

    const registros = await RegistroConsejoComunal.findAll({
      where,
      order: [['id', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sala Situacional CDCE ESTADAL GUÁRICO';
    workbook.created = new Date();

    // =========================================================================
    // HOJA 1: RESUMEN EJECUTIVO, ESTADÍSTICAS Y COMPARATIVAS MULTIDIMENSIONALES
    // =========================================================================
    const wsResumen = workbook.addWorksheet('Resumen & Comparativas', {
      views: [{ showGridLines: true }]
    });

    wsResumen.columns = [
      { width: 5 },  // A
      { width: 32 }, // B
      { width: 18 }, // C
      { width: 18 }, // D
      { width: 18 }, // E
      { width: 22 }, // F
      { width: 5 }   // G
    ];

    // Estilos reutilizables
    const headerBlueFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    const sectionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    const subheaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    // Título Principal
    wsResumen.mergeCells('B2:F2');
    const titleCell = wsResumen.getCell('B2');
    titleCell.value = 'SALA SITUACIONAL CDCE ESTADAL GUÁRICO';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = headerBlueFill;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(2).height = 30;

    wsResumen.mergeCells('B3:F3');
    const subTitleCell = wsResumen.getCell('B3');
    subTitleCell.value = 'INFORME ESTADÍSTICO INTEGRAL Y COMPARATIVO - SECTOR EDUCATIVO EN COMUNAS';
    subTitleCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    subTitleCell.fill = subheaderFill;
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(3).height = 22;

    // Metadatos
    wsResumen.mergeCells('B4:F4');
    const metaCell = wsResumen.getCell('B4');
    metaCell.value = `Generado: ${new Date().toLocaleString('es-VE')} | Registros Analizados: ${registros.length}`;
    metaCell.font = { italic: true, size: 10, color: { argb: 'FF475569' } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(4).height = 20;

    // --- CÁLCULOS ANALÍTICOS Y ESTADÍSTICOS ---
    const totalRegs = registros.length;
    const conComiteCount = registros.filter((r) => r.forma_parte_comite).length;
    const enAsambleasCount = registros.filter((r) => r.participa_asambleas).length;
    const ambosCount = registros.filter((r) => r.forma_parte_comite && r.participa_asambleas).length;

    const edadesValidas = registros
      .map((r) => Number(r.edad))
      .filter((e) => !isNaN(e) && e > 0);

    const edadMedia = edadesValidas.length > 0 ? Number(ss.mean(edadesValidas).toFixed(1)) : 0;
    const edadMediana = edadesValidas.length > 0 ? Number(ss.median(edadesValidas).toFixed(1)) : 0;
    const edadStd = edadesValidas.length > 1 ? Number(ss.standardDeviation(edadesValidas).toFixed(1)) : 0;
    const edadMin = edadesValidas.length > 0 ? ss.min(edadesValidas) : 0;
    const edadMax = edadesValidas.length > 0 ? ss.max(edadesValidas) : 0;
    const edadQ1 = edadesValidas.length > 0 ? Number(ss.quantile(edadesValidas, 0.25).toFixed(1)) : 0;
    const edadQ3 = edadesValidas.length > 0 ? Number(ss.quantile(edadesValidas, 0.75).toFixed(1)) : 0;

    // SECCIÓN 1: KPIs
    let curRow = 6;
    wsResumen.mergeCells(`B${curRow}:F${curRow}`);
    const sec1 = wsResumen.getCell(`B${curRow}`);
    sec1.value = '1. INDICADORES CLAVE DE PARTICIPACIÓN POPULAR (KPIs)';
    sec1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    sec1.fill = sectionFill;
    sec1.alignment = { vertical: 'middle', indent: 1 };
    wsResumen.getRow(curRow).height = 24;
    curRow++;

    const kpiHeaders = ['Métrica / Indicador', 'Valor Nominal', 'Tasa / Porcentaje', 'Observación'];
    wsResumen.mergeCells(`E${curRow}:F${curRow}`);
    const rowKpiH = wsResumen.getRow(curRow);
    rowKpiH.values = [, kpiHeaders[0], kpiHeaders[1], kpiHeaders[2], kpiHeaders[3]];
    rowKpiH.font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };
    rowKpiH.height = 20;
    curRow++;

    const kpiData = [
      ['Total Personal Registrado', totalRegs, '100.0%', 'Base muestral del sector educativo'],
      ['Pertenencia a Comités / Vocerías', conComiteCount, totalRegs > 0 ? `${((conComiteCount / totalRegs) * 100).toFixed(1)}%` : '0%', 'Liderazgo directo en el Consejo Comunal'],
      ['Participación en Asambleas de Ciudadanos', enAsambleasCount, totalRegs > 0 ? `${((enAsambleasCount / totalRegs) * 100).toFixed(1)}%` : '0%', 'Poder popular y toma de decisiones'],
      ['Compromiso Pleno (Comité + Asambleas)', ambosCount, totalRegs > 0 ? `${((ambosCount / totalRegs) * 100).toFixed(1)}%` : '0%', 'Militancia y activación comunal integral']
    ];

    kpiData.forEach((d) => {
      wsResumen.mergeCells(`E${curRow}:F${curRow}`);
      const r = wsResumen.getRow(curRow);
      r.values = [, d[0], d[1], d[2], d[3]];
      r.font = { size: 10 };
      r.alignment = { vertical: 'middle' };
      r.getCell(3).alignment = { horizontal: 'center' };
      r.getCell(4).alignment = { horizontal: 'center' };
      curRow++;
    });

    // SECCIÓN 2: ESTADÍSTICAS DESCRIPTIVAS DE EDAD (LIBRERÍA ESTADÍSTICA)
    curRow += 1;
    wsResumen.mergeCells(`B${curRow}:F${curRow}`);
    const sec2 = wsResumen.getCell(`B${curRow}`);
    sec2.value = '2. ESTADÍSTICAS DESCRIPTIVAS DE EDAD (ANÁLISIS PARAMÉTRICO Y PERCENTILES)';
    sec2.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    sec2.fill = sectionFill;
    sec2.alignment = { vertical: 'middle', indent: 1 };
    wsResumen.getRow(curRow).height = 24;
    curRow++;

    const edadRows = [
      ['Media Aritmética (Promedio de Edad)', `${edadMedia} años`, 'Desviación Estándar (σ)', `±${edadStd} años`],
      ['Mediana (Q2 - 50% de la población)', `${edadMediana} años`, 'Rango Intercuartil (Q3 - Q1)', `${(edadQ3 - edadQ1).toFixed(1)} años`],
      ['Edad Mínima Registrada', `${edadMin} años`, 'Primer Cuartil (Q1 - 25%)', `${edadQ1} años`],
      ['Edad Máxima Registrada', `${edadMax} años`, 'Tercer Cuartil (Q3 - 75%)', `${edadQ3} años`]
    ];

    edadRows.forEach((er) => {
      wsResumen.mergeCells(`E${curRow}:F${curRow}`);
      const r = wsResumen.getRow(curRow);
      r.values = [, er[0], er[1], er[2], er[3]];
      r.font = { size: 10 };
      r.getCell(2).font = { bold: true, color: { argb: 'FF334155' } };
      r.getCell(4).font = { bold: true, color: { argb: 'FF334155' } };
      r.getCell(3).alignment = { horizontal: 'center' };
      r.getCell(5).alignment = { horizontal: 'center' };
      curRow++;
    });

    // SECCIÓN 3: COMPARATIVA GÉNERO VS COMITÉS
    curRow += 1;
    wsResumen.mergeCells(`B${curRow}:F${curRow}`);
    const sec3 = wsResumen.getCell(`B${curRow}`);
    sec3.value = '3. COMPARATIVA CRUZADA: GÉNERO VS LIDERAZGO EN COMITÉS Y ASAMBLEAS';
    sec3.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    sec3.fill = sectionFill;
    sec3.alignment = { vertical: 'middle', indent: 1 };
    wsResumen.getRow(curRow).height = 24;
    curRow++;

    const rowGenH = wsResumen.getRow(curRow);
    rowGenH.values = [, 'Género', 'Total Registros', 'En Comités', 'En Asambleas', 'Tasa Vocería (%)'];
    rowGenH.font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };
    rowGenH.alignment = { horizontal: 'center', vertical: 'middle' };
    rowGenH.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    curRow++;

    const generosSet = ['Mujer', 'Hombre'];
    generosSet.forEach((g) => {
      const gRegs = registros.filter((r) => r.genero === g);
      const gTotal = gRegs.length;
      const gCom = gRegs.filter((r) => r.forma_parte_comite).length;
      const gAsam = gRegs.filter((r) => r.participa_asambleas).length;
      const gPct = gTotal > 0 ? `${((gCom / gTotal) * 100).toFixed(1)}%` : '0.0%';

      const r = wsResumen.getRow(curRow);
      r.values = [, g, gTotal, gCom, gAsam, gPct];
      r.font = { size: 10 };
      r.alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      curRow++;
    });

    // SECCIÓN 4: COMPARATIVA RANGOS ETARIOS
    curRow += 1;
    wsResumen.mergeCells(`B${curRow}:F${curRow}`);
    const sec4 = wsResumen.getCell(`B${curRow}`);
    sec4.value = '4. COMPARATIVA POR RANGOS ETARIOS';
    sec4.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    sec4.fill = sectionFill;
    sec4.alignment = { vertical: 'middle', indent: 1 };
    wsResumen.getRow(curRow).height = 24;
    curRow++;

    const rowEdadH = wsResumen.getRow(curRow);
    rowEdadH.values = [, 'Rango Etario', 'Total Registros', 'En Comités', 'En Asambleas', 'Tasa Vocería (%)'];
    rowEdadH.font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };
    rowEdadH.alignment = { horizontal: 'center', vertical: 'middle' };
    rowEdadH.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    curRow++;

    const gruposEtarios = [
      { nombre: '15-29 (Juventud)', min: 15, max: 29 },
      { nombre: '30-45 (Adulto Joven)', min: 30, max: 45 },
      { nombre: '46-59 (Adulto Maduro)', min: 46, max: 59 },
      { nombre: '60+ (Adulto Mayor)', min: 60, max: 120 }
    ];

    gruposEtarios.forEach((grp) => {
      const eRegs = registros.filter((r) => r.edad >= grp.min && r.edad <= grp.max);
      const eTotal = eRegs.length;
      const eCom = eRegs.filter((r) => r.forma_parte_comite).length;
      const eAsam = eRegs.filter((r) => r.participa_asambleas).length;
      const ePct = eTotal > 0 ? `${((eCom / eTotal) * 100).toFixed(1)}%` : '0.0%';

      const r = wsResumen.getRow(curRow);
      r.values = [, grp.nombre, eTotal, eCom, eAsam, ePct];
      r.font = { size: 10 };
      r.alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      curRow++;
    });

    // SECCIÓN 5: COMPARATIVA POR TIPO DE PERSONAL
    curRow += 1;
    wsResumen.mergeCells(`B${curRow}:F${curRow}`);
    const sec5 = wsResumen.getCell(`B${curRow}`);
    sec5.value = '5. COMPARATIVA POR TIPO DE PERSONAL EDUCATIVO';
    sec5.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    sec5.fill = sectionFill;
    sec5.alignment = { vertical: 'middle', indent: 1 };
    wsResumen.getRow(curRow).height = 24;
    curRow++;

    const rowRolH = wsResumen.getRow(curRow);
    rowRolH.values = [, 'Rol / Función', 'Total Registros', 'En Comités', 'En Asambleas', 'Tasa Vocería (%)'];
    rowRolH.font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };
    rowRolH.alignment = { horizontal: 'center', vertical: 'middle' };
    rowRolH.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    curRow++;

    const rolesMap = {};
    registros.forEach((r) => {
      const rol = r.tipo_personal || 'Sin Asignar';
      if (!rolesMap[rol]) rolesMap[rol] = { total: 0, comite: 0, asamblea: 0 };
      rolesMap[rol].total++;
      if (r.forma_parte_comite) rolesMap[rol].comite++;
      if (r.participa_asambleas) rolesMap[rol].asamblea++;
    });

    Object.entries(rolesMap).forEach(([rol, datos]) => {
      const rPct = datos.total > 0 ? `${((datos.comite / datos.total) * 100).toFixed(1)}%` : '0.0%';
      const r = wsResumen.getRow(curRow);
      r.values = [, rol, datos.total, datos.comite, datos.asamblea, rPct];
      r.font = { size: 10 };
      r.alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      curRow++;
    });

    // =========================================================================
    // HOJA 2: CONSOLIDADO MUNICIPAL (MATRIZ TERRITORIAL)
    // =========================================================================
    const wsMunicipal = workbook.addWorksheet('Consolidado Municipal', {
      views: [{ showGridLines: true }]
    });

    wsMunicipal.columns = [
      { header: '#', key: 'idx', width: 6 },
      { header: 'Municipio', key: 'municipio', width: 26 },
      { header: 'Total Registrados', key: 'total', width: 18 },
      { header: 'Voceros en Comité', key: 'comite', width: 18 },
      { header: 'Participan en Asambleas', key: 'asamblea', width: 22 },
      { header: 'Tasa de Vocería (%)', key: 'tasa', width: 20 },
      { header: '% Aporte al Estado', key: 'aporte', width: 20 }
    ];

    const mHeader = wsMunicipal.getRow(1);
    mHeader.height = 26;
    mHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = headerBlueFill;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const muniMap = {};
    registros.forEach((r) => {
      const m = r.municipio || 'Sin Municipio';
      if (!muniMap[m]) muniMap[m] = { total: 0, comite: 0, asamblea: 0 };
      muniMap[m].total++;
      if (r.forma_parte_comite) muniMap[m].comite++;
      if (r.participa_asambleas) muniMap[m].asamblea++;
    });

    const ordenMunicipios = Object.entries(muniMap).sort((a, b) => b[1].total - a[1].total);
    ordenMunicipios.forEach(([muni, d], i) => {
      const tasa = d.total > 0 ? ((d.comite / d.total) * 100).toFixed(1) + '%' : '0.0%';
      const aporte = totalRegs > 0 ? ((d.total / totalRegs) * 100).toFixed(1) + '%' : '0.0%';
      const r = wsMunicipal.addRow({
        idx: i + 1,
        municipio: muni,
        total: d.total,
        comite: d.comite,
        asamblea: d.asamblea,
        tasa,
        aporte
      });
      r.alignment = { vertical: 'middle' };
      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(3).alignment = { horizontal: 'center' };
      r.getCell(4).alignment = { horizontal: 'center' };
      r.getCell(5).alignment = { horizontal: 'center' };
      r.getCell(6).alignment = { horizontal: 'center' };
      r.getCell(7).alignment = { horizontal: 'center' };
    });

    // =========================================================================
    // HOJA 3: DETALLE NOMINAL COMPLETO (BASE DE DATOS AUDITABLE)
    // =========================================================================
    const wsDetalle = workbook.addWorksheet('Detalle de Registros', {
      views: [{ showGridLines: true }]
    });

    wsDetalle.columns = [
      { header: '#', key: 'index', width: 6 },
      { header: 'Cédula', key: 'cedula', width: 14 },
      { header: 'Nombres y Apellidos', key: 'nombres_apellidos', width: 32 },
      { header: 'Teléfono', key: 'telefono', width: 16 },
      { header: 'Género', key: 'genero', width: 12 },
      { header: 'Edad', key: 'edad', width: 8 },
      { header: 'Tipo Personal', key: 'tipo_personal', width: 22 },
      { header: 'Detalle Personal', key: 'tipo_personal_detalle', width: 26 },
      { header: 'Institución Educativa', key: 'institucion_educativa', width: 34 },
      { header: 'Municipio', key: 'municipio', width: 22 },
      { header: 'Parroquia', key: 'parroquia', width: 22 },
      { header: 'Comunidad / Sector', key: 'comunidad', width: 30 },
      { header: 'Circuito Comunal', key: 'circuito_comunal', width: 22 },
      { header: 'Comuna', key: 'comuna', width: 24 },
      { header: 'Asambleas C.C.', key: 'participa_asambleas', width: 16 },
      { header: 'En Comité', key: 'forma_parte_comite', width: 14 },
      { header: 'Comité / Vocería', key: 'comite', width: 35 },
      { header: 'Detalle Comité', key: 'comite_detalle', width: 26 },
      { header: 'Fecha Registro', key: 'fecha', width: 18 }
    ];

    const dHeader = wsDetalle.getRow(1);
    dHeader.height = 26;
    dHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = headerBlueFill;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    registros.forEach((reg, i) => {
      const fechaRegistro = reg.created_at || reg.createdAt;
      const row = wsDetalle.addRow({
        index: i + 1,
        cedula: `${reg.nacionalidad}-${reg.cedula}`,
        nombres_apellidos: reg.nombres_apellidos,
        telefono: reg.telefono,
        genero: reg.genero || 'N/A',
        edad: reg.edad != null ? reg.edad : 'N/A',
        tipo_personal: reg.tipo_personal,
        tipo_personal_detalle: reg.tipo_personal_detalle || 'N/A',
        institucion_educativa: reg.institucion_educativa || 'N/A',
        municipio: reg.municipio,
        parroquia: reg.parroquia,
        comunidad: reg.comunidad,
        circuito_comunal: reg.circuito_comunal || 'N/A',
        comuna: reg.comuna || 'N/A',
        participa_asambleas: reg.participa_asambleas ? 'SÍ' : 'NO',
        forma_parte_comite: reg.forma_parte_comite ? 'SÍ' : 'NO',
        comite: reg.comite || 'N/A',
        comite_detalle: reg.comite_detalle || 'N/A',
        fecha: fechaRegistro ? new Date(fechaRegistro).toLocaleDateString('es-VE') : 'N/A'
      });
      row.alignment = { vertical: 'middle' };
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(5).alignment = { horizontal: 'center' };
      row.getCell(6).alignment = { horizontal: 'center' };
      row.getCell(15).alignment = { horizontal: 'center' };
      row.getCell(16).alignment = { horizontal: 'center' };
      row.getCell(19).alignment = { horizontal: 'center' };
    });

    // Filtros automáticos en Detalle
    wsDetalle.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: registros.length + 1, column: 19 }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Estadistico_Consejos_Comunales_CDCE.xlsx"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return res.status(500).json({ error: 'Error al generar reporte Excel' });
  }
};
