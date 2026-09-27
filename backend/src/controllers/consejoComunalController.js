const { RegistroConsejoComunal, PadronPersonal, sequelize } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

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
 * Registro institucional público (Mobile-First)
 */
exports.crearRegistro = async (req, res) => {
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

    // 7. Persistencia
    const nuevoRegistro = await RegistroConsejoComunal.create({
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
    });

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
 * Estadísticas consolidadas para dashboard administrativo
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const totalRegistros = await RegistroConsejoComunal.count();
    const conComite = await RegistroConsejoComunal.count({ where: { forma_parte_comite: true } });
    const enAsambleas = await RegistroConsejoComunal.count({ where: { participa_asambleas: true } });

    const porMunicipio = await RegistroConsejoComunal.findAll({
      attributes: [
        'municipio',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['municipio'],
      order: [[sequelize.literal('total'), 'DESC']]
    });

    const porTipoPersonal = await RegistroConsejoComunal.findAll({
      attributes: [
        'tipo_personal',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['tipo_personal'],
      order: [[sequelize.literal('total'), 'DESC']]
    });

    const porGenero = await RegistroConsejoComunal.findAll({
      attributes: [
        'genero',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      where: {
        genero: { [Op.ne]: null }
      },
      group: ['genero'],
      order: [[sequelize.literal('total'), 'DESC']]
    });

    return res.json({
      totalRegistros,
      conComite,
      enAsambleas,
      porMunicipio,
      porTipoPersonal,
      porGenero
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
      where.municipio = String(municipio).trim();
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
 * Exportación completa a Excel formateado con ExcelJS
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
      where.municipio = String(municipio).trim();
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
    workbook.title = 'Participación Comunal - Sala Situacional CDCE ESTADAL GUÁRICO';
    const worksheet = workbook.addWorksheet('Participación Comunal', {
      views: [{ showGridLines: true }]
    });

    worksheet.columns = [
      { header: '#', key: 'index', width: 6 },
      { header: 'Cédula', key: 'cedula', width: 14 },
      { header: 'Nombres y Apellidos', key: 'nombres_apellidos', width: 32 },
      { header: 'Teléfono', key: 'telefono', width: 16 },
      { header: 'Género', key: 'genero', width: 14 },
      { header: 'Edad', key: 'edad', width: 10 },
      { header: 'Tipo Personal', key: 'tipo_personal', width: 22 },
      { header: 'Detalle Personal', key: 'tipo_personal_detalle', width: 26 },
      { header: 'Institución Educativa', key: 'institucion_educativa', width: 30 },
      { header: 'Municipio', key: 'municipio', width: 20 },
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

    const headerRow = worksheet.getRow(1);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    registros.forEach((reg, i) => {
      const fechaRegistro = reg.created_at || reg.createdAt;
      const row = worksheet.addRow({
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
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Consejos_Comunales.xlsx"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return res.status(500).json({ error: 'Error al generar reporte Excel' });
  }
};
