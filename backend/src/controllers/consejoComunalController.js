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
      tipo_personal,
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
      tipo_personal: personalValor,
      tipo_personal_detalle: personalDetalle,
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

    return res.status(201).json({
      success: true,
      message: 'Registro comunal institucional guardado exitosamente.',
      registro: {
        id: nuevoRegistro.id,
        nacionalidad: nuevoRegistro.nacionalidad,
        cedula: nuevoRegistro.cedula,
        nombres_apellidos: nuevoRegistro.nombres_apellidos,
        municipio: nuevoRegistro.municipio,
        parroquia: nuevoRegistro.parroquia,
        createdAt: nuevoRegistro.createdAt
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

    return res.json({
      totalRegistros,
      conComite,
      enAsambleas,
      porMunicipio,
      porTipoPersonal
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
      forma_parte_comite = ''
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const where = {};

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { cedula: { [Op.iLike]: s } },
        { nombres_apellidos: { [Op.iLike]: s } },
        { comunidad: { [Op.iLike]: s } }
      ];
    }

    if (municipio && municipio.trim()) {
      where.municipio = municipio.trim();
    }

    if (tipo_personal && tipo_personal.trim()) {
      where.tipo_personal = tipo_personal.trim();
    }

    if (forma_parte_comite !== '') {
      where.forma_parte_comite = forma_parte_comite === 'true' || forma_parte_comite === true;
    }

    const { count, rows } = await RegistroConsejoComunal.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
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
    const { municipio, tipo_personal } = req.query;
    const where = {};
    if (municipio) where.municipio = municipio;
    if (tipo_personal) where.tipo_personal = tipo_personal;

    const registros = await RegistroConsejoComunal.findAll({
      where,
      order: [['municipio', 'ASC'], ['createdAt', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SISEDGUA - CDCE ESTADAL GUÁRICO';
    const worksheet = workbook.addWorksheet('Participación Comunal', {
      views: [{ showGridLines: true }]
    });

    worksheet.columns = [
      { header: '#', key: 'index', width: 6 },
      { header: 'Cédula', key: 'cedula', width: 14 },
      { header: 'Nombres y Apellidos', key: 'nombres_apellidos', width: 32 },
      { header: 'Teléfono', key: 'telefono', width: 16 },
      { header: 'Tipo Personal', key: 'tipo_personal', width: 22 },
      { header: 'Detalle Personal', key: 'tipo_personal_detalle', width: 26 },
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
      const row = worksheet.addRow({
        index: i + 1,
        cedula: `${reg.nacionalidad}-${reg.cedula}`,
        nombres_apellidos: reg.nombres_apellidos,
        telefono: reg.telefono,
        tipo_personal: reg.tipo_personal,
        tipo_personal_detalle: reg.tipo_personal_detalle || 'N/A',
        municipio: reg.municipio,
        parroquia: reg.parroquia,
        comunidad: reg.comunidad,
        circuito_comunal: reg.circuito_comunal || 'N/A',
        comuna: reg.comuna || 'N/A',
        participa_asambleas: reg.participa_asambleas ? 'SÍ' : 'NO',
        forma_parte_comite: reg.forma_parte_comite ? 'SÍ' : 'NO',
        comite: reg.comite || 'N/A',
        comite_detalle: reg.comite_detalle || 'N/A',
        fecha: new Date(reg.createdAt).toLocaleDateString('es-VE')
      });
      row.alignment = { vertical: 'middle' };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte_Consejos_Comunales_Guarico_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    res.status(500).json({ error: 'Error al generar reporte Excel' });
  }
};
