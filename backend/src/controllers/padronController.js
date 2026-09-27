const { PadronPersonal, sequelize } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

const REGEX_CEDULA = /^\d{5,9}$/;
const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.,'-]{3,150}$/;

const sanitizarTexto = (texto) => {
  if (typeof texto !== 'string') return '';
  return texto.trim().replace(/[<>]/g, '').replace(/\s+/g, ' ');
};

/**
 * GET /api/padron/consulta/:nacionalidad/:cedula
 * Endpoint para autocompletado en formulario público o administrativo
 */
exports.consultarCedula = async (req, res) => {
  try {
    const nacionalidad = String(req.params.nacionalidad || 'V').toUpperCase();
    const cedula = String(req.params.cedula || '').trim().replace(/\D/g, '');

    if (!['V', 'E'].includes(nacionalidad)) {
      return res.status(400).json({ error: 'Nacionalidad no válida (debe ser V o E).' });
    }

    if (!REGEX_CEDULA.test(cedula)) {
      return res.status(400).json({ error: 'Número de cédula inválido.' });
    }

    const persona = await PadronPersonal.findOne({
      where: { nacionalidad, cedula },
      attributes: ['id', 'nacionalidad', 'cedula', 'nombres_apellidos', 'tipo_personal', 'municipio']
    });

    if (!persona) {
      return res.json({
        found: false,
        message: 'La cédula no figura en el padrón preliminar. Puede ingresar los datos manualmente.'
      });
    }

    return res.json({
      found: true,
      persona: {
        id: persona.id,
        nacionalidad: persona.nacionalidad,
        cedula: persona.cedula,
        nombres_apellidos: persona.nombres_apellidos,
        tipo_personal: persona.tipo_personal || 'Docente',
        municipio: persona.municipio || ''
      }
    });
  } catch (error) {
    console.error('Error al consultar cédula en padrón:', error);
    return res.status(500).json({ error: 'Error interno al consultar el padrón.' });
  }
};

/**
 * POST /api/padron/manual
 * Alta o edición de una persona en el padrón (Admin)
 */
exports.cargarManual = async (req, res) => {
  try {
    const { nacionalidad = 'V', cedula, nombres_apellidos, tipo_personal = 'Docente', municipio = '' } = req.body;

    const nac = String(nacionalidad).toUpperCase();
    if (!['V', 'E'].includes(nac)) {
      return res.status(400).json({ error: 'Nacionalidad inválida (debe ser V o E).' });
    }

    const cleanCedula = String(cedula || '').trim().replace(/\D/g, '');
    if (!REGEX_CEDULA.test(cleanCedula)) {
      return res.status(400).json({ error: 'La cédula debe ser numérica entre 5 y 9 dígitos.' });
    }

    const cleanNombres = sanitizarTexto(nombres_apellidos);
    if (!REGEX_NOMBRE.test(cleanNombres)) {
      return res.status(400).json({ error: 'Nombres y Apellidos no válidos.' });
    }

    const cleanTipo = sanitizarTexto(tipo_personal) || 'Docente';
    const cleanMun = sanitizarTexto(municipio);

    const [registro, created] = await PadronPersonal.upsert({
      nacionalidad: nac,
      cedula: cleanCedula,
      nombres_apellidos: cleanNombres,
      tipo_personal: cleanTipo,
      municipio: cleanMun || null
    }, {
      returning: true
    });

    return res.json({
      success: true,
      created,
      message: created ? 'Personal agregado al padrón con éxito.' : 'Personal actualizado en el padrón.',
      data: registro
    });
  } catch (error) {
    console.error('Error al guardar en padrón:', error);
    return res.status(500).json({ error: 'Error al registrar personal en el padrón.' });
  }
};

/**
 * POST /api/padron/masivo
 * Carga masiva de cédulas y nombres mediante array JSON o texto plano delimitado (Admin)
 */
exports.cargarMasivo = async (req, res) => {
  try {
    const { rawText, personas } = req.body;
    let listaAProcesar = [];

    if (Array.isArray(personas) && personas.length > 0) {
      listaAProcesar = personas;
    } else if (typeof rawText === 'string' && rawText.trim().length > 0) {
      // Parsear líneas de texto pegadas (soporta CSV, TSV, o comas)
      const lineas = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      for (const linea of lineas) {
        // Ignorar encabezados comunes si existen
        if (/^(cedula|cédula|ci|nombres|nombre)/i.test(linea)) continue;

        // Separar por coma, punto y coma, o tabulador
        const partes = linea.split(/[,;\t]+/).map(p => p.trim());
        if (partes.length >= 2) {
          let cedStr = partes[0].toUpperCase();
          let nac = 'V';
          if (cedStr.startsWith('V-') || cedStr.startsWith('V')) {
            nac = 'V';
            cedStr = cedStr.replace(/^V-?/, '');
          } else if (cedStr.startsWith('E-') || cedStr.startsWith('E')) {
            nac = 'E';
            cedStr = cedStr.replace(/^E-?/, '');
          }

          const cleanCed = cedStr.replace(/\D/g, '');
          const nombres = sanitizarTexto(partes[1]);
          const tipo = partes[2] ? sanitizarTexto(partes[2]) : 'Docente';
          const mun = partes[3] ? sanitizarTexto(partes[3]) : null;

          if (REGEX_CEDULA.test(cleanCed) && REGEX_NOMBRE.test(nombres)) {
            listaAProcesar.push({
              nacionalidad: nac,
              cedula: cleanCed,
              nombres_apellidos: nombres,
              tipo_personal: tipo,
              municipio: mun
            });
          }
        }
      }
    }

    if (listaAProcesar.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron registros válidos para procesar. Formato esperado: CÉDULA, NOMBRES Y APELLIDOS, TIPO PERSONAL, MUNICIPIO'
      });
    }

    // Filtrar duplicados dentro de la misma lista entrante para evitar conflictos
    const mapaUnicos = new Map();
    for (const item of listaAProcesar) {
      const key = `${item.nacionalidad}-${item.cedula}`;
      mapaUnicos.set(key, item);
    }
    const unicos = Array.from(mapaUnicos.values());

    // Cargar en bulk con actualización de duplicados
    await PadronPersonal.bulkCreate(unicos, {
      updateOnDuplicate: ['nombres_apellidos', 'tipo_personal', 'municipio']
    });

    return res.json({
      success: true,
      totalProcesados: unicos.length,
      message: `¡Carga exitosa! Se procesaron y actualizaron ${unicos.length} funcionarios en el padrón institucional.`
    });
  } catch (error) {
    console.error('Error en carga masiva de padrón:', error);
    return res.status(500).json({ error: 'Error al procesar la carga masiva en el padrón.' });
  }
};

/**
 * GET /api/padron
 * Lista paginada con buscador y filtros (Admin)
 */
exports.listarPadron = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      municipio = '',
      tipo_personal = ''
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const where = {};

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { cedula: { [Op.iLike]: s } },
        { nombres_apellidos: { [Op.iLike]: s } }
      ];
    }

    if (municipio && municipio.trim()) {
      where.municipio = { [Op.iLike]: `%${municipio.trim()}%` };
    }

    if (tipo_personal && tipo_personal.trim()) {
      where.tipo_personal = tipo_personal.trim();
    }

    const { count, rows } = await PadronPersonal.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['cedula', 'ASC']]
    });

    return res.json({
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
      data: rows
    });
  } catch (error) {
    console.error('Error al listar padrón:', error);
    return res.status(500).json({ error: 'Error al consultar el padrón.' });
  }
};

/**
 * DELETE /api/padron/:id
 * Eliminar funcionario del padrón (Admin)
 */
exports.eliminarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const persona = await PadronPersonal.findByPk(id);
    if (!persona) {
      return res.status(404).json({ error: 'Registro no encontrado en el padrón.' });
    }

    await persona.destroy();
    return res.json({ success: true, message: 'Registro eliminado del padrón.' });
  } catch (error) {
    console.error('Error al eliminar del padrón:', error);
    return res.status(500).json({ error: 'Error al eliminar el registro.' });
  }
};

/**
 * GET /api/padron/stats
 * Estadísticas generales del padrón
 */
exports.estadisticasPadron = async (req, res) => {
  try {
    const total = await PadronPersonal.count();

    const porTipo = await PadronPersonal.findAll({
      attributes: [
        'tipo_personal',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['tipo_personal'],
      order: [[sequelize.literal('total'), 'DESC']]
    });

    const porMunicipio = await PadronPersonal.findAll({
      attributes: [
        'municipio',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      where: {
        municipio: { [Op.ne]: null }
      },
      group: ['municipio'],
      order: [[sequelize.literal('total'), 'DESC']]
    });

    return res.json({
      total,
      porTipo,
      porMunicipio
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del padrón:', error);
    return res.status(500).json({ error: 'Error al consultar estadísticas del padrón.' });
  }
};

/**
 * GET /api/padron/export/excel
 * Exportación de registros del padrón a Excel profesional (Admin)
 */
exports.exportarExcel = async (req, res) => {
  try {
    const { search = '', municipio = '', tipo_personal = '' } = req.query;
    const where = {};

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { cedula: { [Op.iLike]: s } },
        { nombres_apellidos: { [Op.iLike]: s } }
      ];
    }

    if (municipio && String(municipio).trim()) {
      where.municipio = { [Op.iLike]: `%${String(municipio).trim()}%` };
    }

    if (tipo_personal && String(tipo_personal).trim()) {
      where.tipo_personal = String(tipo_personal).trim();
    }

    const registros = await PadronPersonal.findAll({
      where,
      order: [['cedula', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sala Situacional CDCE ESTADAL GUÁRICO';
    workbook.title = 'Padrón Personal Educativo - Sala Situacional CDCE ESTADAL GUÁRICO';

    const worksheet = workbook.addWorksheet('Padrón Personal', {
      views: [{ showGridLines: true }]
    });

    worksheet.columns = [
      { header: 'Nacionalidad', key: 'nacionalidad', width: 14 },
      { header: 'Cédula', key: 'cedula', width: 18 },
      { header: 'Nombres y Apellidos', key: 'nombres_apellidos', width: 36 },
      { header: 'Tipo Personal', key: 'tipo_personal', width: 25 },
      { header: 'Municipio', key: 'municipio', width: 25 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    registros.forEach((reg) => {
      const row = worksheet.addRow({
        nacionalidad: reg.nacionalidad || 'V',
        cedula: reg.cedula,
        nombres_apellidos: reg.nombres_apellidos,
        tipo_personal: reg.tipo_personal || 'Docente',
        municipio: reg.municipio || 'N/A'
      });
      row.height = 20;
      row.alignment = { vertical: 'middle' };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Padron_Personal_Educativo.xlsx"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  } catch (error) {
    console.error('Error al exportar padrón a Excel:', error);
    return res.status(500).json({ error: 'Error al exportar registros del padrón a Excel.' });
  }
};

/**
 * POST /api/padron/import/excel
 * Importación masiva de funcionarios desde archivo Excel (Admin)
 */
exports.importarExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo Excel (.xlsx o .xls).' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: 'El archivo Excel no contiene ninguna hoja con datos.' });
    }

    // Detectar dinámicamente columnas por nombre de encabezado en la primera fila
    let colNac = -1;
    let colCed = -1;
    let colNom = -1;
    let colTipo = -1;
    let colMun = -1;

    const row1 = worksheet.getRow(1);
    row1.eachCell((cell, colNumber) => {
      const val = String(cell.value || '').toLowerCase().trim();
      if (val.includes('nacion')) colNac = colNumber;
      else if (val.includes('cedula') || val.includes('cédula') || val === 'ci') colCed = colNumber;
      else if (val.includes('nombre') || val.includes('apellido') || val.includes('funcionario')) colNom = colNumber;
      else if (val.includes('tipo') || val.includes('cargo') || val.includes('rol')) colTipo = colNumber;
      else if (val.includes('municip')) colMun = colNumber;
    });

    const tieneCabecera = (colCed !== -1 || colNom !== -1);
    const listaAProcesar = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Omitir fila 1 (encabezado)

      let nac = 'V';
      let rawCed = '';
      let rawNom = '';
      let rawTipo = 'Docente';
      let rawMun = null;

      if (tieneCabecera) {
        if (colNac !== -1) nac = String(row.getCell(colNac).value || 'V').trim().toUpperCase();
        if (colCed !== -1) rawCed = String(row.getCell(colCed).value || '').trim();
        if (colNom !== -1) rawNom = String(row.getCell(colNom).value || '').trim();
        if (colTipo !== -1) rawTipo = String(row.getCell(colTipo).value || 'Docente').trim();
        if (colMun !== -1) rawMun = String(row.getCell(colMun).value || '').trim();
      } else {
        // Fallback posicional
        const val1 = String(row.getCell(1).value || '').trim();
        const val2 = String(row.getCell(2).value || '').trim();
        const val3 = String(row.getCell(3).value || '').trim();
        const val4 = String(row.getCell(4).value || '').trim();
        const val5 = String(row.getCell(5).value || '').trim();

        if (['V', 'E', 'V-', 'E-'].includes(val1.toUpperCase())) {
          nac = val1.replace('-', '').toUpperCase();
          rawCed = val2;
          rawNom = val3;
          rawTipo = val4 || 'Docente';
          rawMun = val5 || null;
        } else {
          rawCed = val1;
          rawNom = val2;
          rawTipo = val3 || 'Docente';
          rawMun = val4 || null;
        }
      }

      // Normalizar cédula y prefijo de nacionalidad si está incluido
      let cedStr = rawCed.toUpperCase();
      if (cedStr.startsWith('V-') || cedStr.startsWith('V')) {
        nac = 'V';
        cedStr = cedStr.replace(/^V-?/, '');
      } else if (cedStr.startsWith('E-') || cedStr.startsWith('E')) {
        nac = 'E';
        cedStr = cedStr.replace(/^E-?/, '');
      }

      const cleanCed = cedStr.replace(/\D/g, '');
      const nombres = sanitizarTexto(rawNom);
      const tipo = sanitizarTexto(rawTipo) || 'Docente';
      const mun = sanitizarTexto(rawMun) || null;

      if (!['V', 'E'].includes(nac)) nac = 'V';

      if (REGEX_CEDULA.test(cleanCed) && REGEX_NOMBRE.test(nombres)) {
        listaAProcesar.push({
          nacionalidad: nac,
          cedula: cleanCed,
          nombres_apellidos: nombres,
          tipo_personal: tipo,
          municipio: mun
        });
      }
    });

    if (listaAProcesar.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron registros válidos para procesar. Verifique que las columnas contengan Cédula y Nombres válidos.'
      });
    }

    // Filtrar duplicados dentro de la misma lista
    const mapaUnicos = new Map();
    for (const item of listaAProcesar) {
      const key = `${item.nacionalidad}-${item.cedula}`;
      mapaUnicos.set(key, item);
    }
    const unicos = Array.from(mapaUnicos.values());

    await PadronPersonal.bulkCreate(unicos, {
      updateOnDuplicate: ['nombres_apellidos', 'tipo_personal', 'municipio']
    });

    return res.json({
      success: true,
      total: unicos.length,
      message: `¡Importación exitosa! Se procesaron y actualizaron ${unicos.length} funcionarios en el padrón institucional.`
    });
  } catch (error) {
    console.error('Error en importación de Excel en padrón:', error);
    return res.status(500).json({ error: 'Error al procesar el archivo Excel.' });
  }
};

