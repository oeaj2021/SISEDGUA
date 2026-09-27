const { Institucion } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

const buildWhereClause = (query) => {
  const { municipio, turno, search } = query;
  const where = {};

  if (municipio) {
    const cleanMun = municipio.toUpperCase().trim();
    if (cleanMun.includes('SANTA MARIA') || cleanMun.includes('IPIRE')) {
      where.municipio = { [Op.in]: ['SANTA MARIA', 'SANTA MARIA DE IPIRE'] };
    } else if (cleanMun.includes('ROSCIO')) {
      where.municipio = 'ROSCIO';
    } else if (cleanMun.includes('INFANTE')) {
      where.municipio = 'INFANTE';
    } else if (cleanMun.includes('MIRANDA')) {
      where.municipio = 'MIRANDA';
    } else if (cleanMun.includes('MONAGAS')) {
      where.municipio = 'MONAGAS';
    } else if (cleanMun.includes('MELLADO')) {
      where.municipio = 'MELLADO';
    } else if (cleanMun.includes('RIBAS')) {
      where.municipio = 'RIBAS';
    } else if (cleanMun.includes('RONDON')) {
      where.municipio = 'RONDON';
    } else if (cleanMun.includes('SOCORRO')) {
      where.municipio = 'EL SOCORRO';
    } else if (cleanMun.includes('CHAGUARAMAS')) {
      where.municipio = 'CHAGUARAMAS';
    } else if (cleanMun.includes('GUAYABAL')) {
      where.municipio = 'GUAYABAL';
    } else if (cleanMun.includes('CAMAGUAN')) {
      where.municipio = 'CAMAGUAN';
    } else if (cleanMun.includes('GUARIBE')) {
      where.municipio = 'GUARIBE';
    } else if (cleanMun.includes('ORTIZ')) {
      where.municipio = 'ORTIZ';
    } else if (cleanMun.includes('ZARAZA')) {
      where.municipio = 'ZARAZA';
    } else {
      where.municipio = cleanMun;
    }
  }

  if (turno && ['MAÑANA', 'TARDE'].includes(turno)) {
    where[Op.or] = [
      { turno: turno },
      { turno: 'AMBOS' }
    ];
  }

  if (search) {
    where[Op.and] = [
      ...(where[Op.and] || []),
      {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { codigo: { [Op.iLike]: `%${search}%` } }
        ]
      }
    ];
  }

  return where;
};

exports.getAll = async (req, res) => {
  try {
    const where = { activo: true, ...buildWhereClause(req.query) };

    const instituciones = await Institucion.findAll({
      where,
      order: [['municipio', 'ASC'], ['nombre', 'ASC']]
    });

    return res.json(instituciones);
  } catch (error) {
    console.error('Error al obtener instituciones:', error);
    return res.status(500).json({ error: 'Error al consultar catálogo de instituciones' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const institucion = await Institucion.findByPk(id);
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }
    return res.json(institucion);
  } catch (error) {
    console.error('Error al obtener institución por ID:', error);
    return res.status(500).json({ error: 'Error al consultar institución' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      municipio,
      nombre,
      codigo,
      turno,
      max_matricula,
      max_docentes,
      max_administrativo,
      max_obreros,
      max_cocineros
    } = req.body;

    if (!municipio || !nombre) {
      return res.status(400).json({ error: 'Municipio y Nombre son requeridos' });
    }

    const nueva = await Institucion.create({
      municipio: municipio.toUpperCase().trim(),
      nombre: nombre.trim(),
      codigo: codigo ? codigo.trim() : null,
      turno: turno || 'AMBOS',
      max_matricula: parseInt(max_matricula || 0, 10),
      max_docentes: parseInt(max_docentes || 0, 10),
      max_administrativo: parseInt(max_administrativo || 0, 10),
      max_obreros: parseInt(max_obreros || 0, 10),
      max_cocineros: parseInt(max_cocineros || 0, 10)
    });

    return res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear institución:', error);
    return res.status(500).json({ error: 'Error al registrar institución' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const institucion = await Institucion.findByPk(id);
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    const {
      municipio,
      nombre,
      codigo,
      turno,
      max_matricula,
      max_docentes,
      max_administrativo,
      max_obreros,
      max_cocineros,
      activo
    } = req.body;

    await institucion.update({
      municipio: municipio ? municipio.toUpperCase().trim() : institucion.municipio,
      nombre: nombre ? nombre.trim() : institucion.nombre,
      codigo: codigo !== undefined ? (codigo ? codigo.trim() : null) : institucion.codigo,
      turno: turno || institucion.turno,
      max_matricula: max_matricula !== undefined ? parseInt(max_matricula, 10) : institucion.max_matricula,
      max_docentes: max_docentes !== undefined ? parseInt(max_docentes, 10) : institucion.max_docentes,
      max_administrativo: max_administrativo !== undefined ? parseInt(max_administrativo, 10) : institucion.max_administrativo,
      max_obreros: max_obreros !== undefined ? parseInt(max_obreros, 10) : institucion.max_obreros,
      max_cocineros: max_cocineros !== undefined ? parseInt(max_cocineros, 10) : institucion.max_cocineros,
      activo: activo !== undefined ? activo : institucion.activo
    });

    return res.json(institucion);
  } catch (error) {
    console.error('Error al actualizar institución:', error);
    return res.status(500).json({ error: 'Error al actualizar institución' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const institucion = await Institucion.findByPk(id);
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    // Soft delete o borrado definitivo
    await institucion.destroy();
    return res.json({ mensaje: 'Institución eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar institución:', error);
    return res.status(500).json({ error: 'Error al eliminar institución' });
  }
};

// Eliminación masiva de múltiples filas seleccionadas
exports.deleteBatch = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar un arreglo de IDs a eliminar' });
    }

    const eliminados = await Institucion.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    });

    return res.json({
      ok: true,
      mensaje: `${eliminados} instituciones eliminadas exitosamente`,
      eliminados
    });
  } catch (error) {
    console.error('Error en eliminación masiva:', error);
    return res.status(500).json({ error: 'Error al eliminar las instituciones seleccionadas' });
  }
};

// Resumen de capacidad agregada por municipio y turno
exports.getCapacidadMunicipios = async (req, res) => {
  try {
    const instituciones = await Institucion.findAll({ where: { activo: true } });
    const resumen = {};

    instituciones.forEach(inst => {
      const mun = inst.municipio;
      if (!resumen[mun]) {
        resumen[mun] = {
          municipio: mun,
          total_instituciones: 0,
          max_matricula: 0,
          max_docentes: 0,
          max_administrativo: 0,
          max_obreros: 0,
          max_cocineros: 0
        };
      }
      resumen[mun].total_instituciones += 1;
      resumen[mun].max_matricula += (inst.max_matricula || 0);
      resumen[mun].max_docentes += (inst.max_docentes || 0);
      resumen[mun].max_administrativo += (inst.max_administrativo || 0);
      resumen[mun].max_obreros += (inst.max_obreros || 0);
      resumen[mun].max_cocineros += (inst.max_cocineros || 0);
    });

    return res.json(Object.values(resumen));
  } catch (error) {
    console.error('Error al calcular capacidades por municipio:', error);
    return res.status(500).json({ error: 'Error al calcular capacidades' });
  }
};

/**
 * Exporta el catálogo de instituciones a archivo Excel (.xlsx)
 * Aplica filtros opcionales de municipio, turno, search
 */
exports.exportarExcel = async (req, res) => {
  try {
    const where = buildWhereClause(req.query);
    if (req.query.activo !== undefined) {
      where.activo = req.query.activo === 'true';
    }

    const instituciones = await Institucion.findAll({
      where,
      order: [['municipio', 'ASC'], ['nombre', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sala Situacional CDCE ESTADAL GUÁRICO';
    workbook.title = 'Catálogo de Instituciones Educativas - Sala Situacional CDCE ESTADAL GUÁRICO';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Catálogo Instituciones');

    worksheet.columns = [
      { header: 'Código', key: 'codigo', width: 16 },
      { header: 'Nombre de Institución', key: 'nombre', width: 42 },
      { header: 'Municipio', key: 'municipio', width: 22 },
      { header: 'Turno', key: 'turno', width: 14 },
      { header: 'Capacidad Matrícula', key: 'max_matricula', width: 20 },
      { header: 'Docentes', key: 'max_docentes', width: 14 },
      { header: 'Administrativo', key: 'max_administrativo', width: 16 },
      { header: 'Obreros', key: 'max_obreros', width: 14 },
      { header: 'Cocineros', key: 'max_cocineros', width: 14 },
      { header: 'Activo', key: 'activo', width: 12 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Azul marino (#1e3a8a)
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    instituciones.forEach((inst) => {
      const row = worksheet.addRow({
        codigo: inst.codigo || '',
        nombre: inst.nombre,
        municipio: inst.municipio,
        turno: inst.turno || 'AMBOS',
        max_matricula: inst.max_matricula || 0,
        max_docentes: inst.max_docentes || 0,
        max_administrativo: inst.max_administrativo || 0,
        max_obreros: inst.max_obreros || 0,
        max_cocineros: inst.max_cocineros || 0,
        activo: inst.activo ? 'SÍ' : 'NO'
      });

      row.height = 22;

      // Alineaciones
      row.getCell('codigo').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('nombre').alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell('municipio').alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell('turno').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('max_matricula').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('max_docentes').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('max_administrativo').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('max_obreros').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('max_cocineros').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('activo').alignment = { horizontal: 'center', vertical: 'middle' };

      // Bordes limpios
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    worksheet.autoFilter = { from: 'A1', to: 'J1' };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Catalogo_Instituciones_Guarico.xlsx"');
    return res.send(buffer);
  } catch (error) {
    console.error('Error al exportar catálogo a Excel:', error);
    return res.status(500).json({ error: 'Error al exportar catálogo a Excel' });
  }
};

/**
 * Importa o actualiza instituciones masivamente desde un archivo Excel (.xlsx)
 */
exports.importarExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Debe cargar un archivo Excel (.xlsx) válido en el campo "archivo".' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: 'El archivo Excel no contiene hojas utilizables.' });
    }

    // Identificar posiciones de columnas a partir de la fila de cabecera
    const headerRow = worksheet.getRow(1);
    let colCodigo = 1;
    let colNombre = 2;
    let colMunicipio = 3;
    let colTurno = 4;
    let colMatricula = 5;
    let colDocentes = 6;
    let colAdmin = 7;
    let colObreros = 8;
    let colCocineros = 9;
    let colActivo = 10;

    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || '').toLowerCase().trim();
      if (/c[oó]digo/i.test(val)) colCodigo = colNumber;
      else if (/nombre|instituci[oó]n|plantel/i.test(val)) colNombre = colNumber;
      else if (/municipio/i.test(val)) colMunicipio = colNumber;
      else if (/turno/i.test(val)) colTurno = colNumber;
      else if (/matr[ií]cula|capacidad/i.test(val)) colMatricula = colNumber;
      else if (/docente/i.test(val)) colDocentes = colNumber;
      else if (/admin/i.test(val)) colAdmin = colNumber;
      else if (/obrero/i.test(val)) colObreros = colNumber;
      else if (/cocin/i.test(val)) colCocineros = colNumber;
      else if (/activo/i.test(val)) colActivo = colNumber;
    });

    const getCellValue = (cell) => {
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object') {
        if (cell.value.text !== undefined) return cell.value.text;
        if (cell.value.result !== undefined) return cell.value.result;
      }
      return cell.value;
    };

    let creados = 0;
    let actualizados = 0;
    let ignorados = 0;
    const errores = [];

    const totalRows = worksheet.rowCount;

    for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row || !row.hasValues) continue;

      const rawCodigo = String(getCellValue(row.getCell(colCodigo)) || '').trim();
      const rawNombre = String(getCellValue(row.getCell(colNombre)) || '').trim();
      const rawMun = String(getCellValue(row.getCell(colMunicipio)) || '').trim().toUpperCase();
      const rawTurno = String(getCellValue(row.getCell(colTurno)) || '').trim().toUpperCase();
      const rawMatricula = getCellValue(row.getCell(colMatricula));
      const rawDocentes = getCellValue(row.getCell(colDocentes));
      const rawAdmin = getCellValue(row.getCell(colAdmin));
      const rawObreros = getCellValue(row.getCell(colObreros));
      const rawCocineros = getCellValue(row.getCell(colCocineros));
      const rawActivo = String(getCellValue(row.getCell(colActivo)) || '').trim().toUpperCase();

      // Descartar si está vacío o si es una repetición de encabezado
      if (!rawNombre && !rawMun) {
        continue;
      }

      if (/^nombre$/i.test(rawNombre) || /^municipio$/i.test(rawMun)) {
        continue;
      }

      if (!rawNombre || !rawMun) {
        ignorados++;
        errores.push(`Fila ${rowNumber}: Debe especificar Municipio y Nombre.`);
        continue;
      }

      // Normalizar Turno
      let turno = 'AMBOS';
      if (rawTurno.includes('MAÑANA')) turno = 'MAÑANA';
      else if (rawTurno.includes('TARDE')) turno = 'TARDE';
      else if (rawTurno.includes('AMBOS')) turno = 'AMBOS';

      // Normalizar Estado Activo
      let activo = true;
      if (rawActivo === 'NO' || rawActivo === 'FALSE' || rawActivo === '0' || rawActivo === 'INACTIVO') {
        activo = false;
      }

      // Normalizar Municipio Guárico estándar si aplica
      let municipio = rawMun;
      if (rawMun.includes('SANTA MARIA') || rawMun.includes('IPIRE')) municipio = 'SANTA MARIA';
      else if (rawMun.includes('ROSCIO')) municipio = 'ROSCIO';
      else if (rawMun.includes('INFANTE')) municipio = 'INFANTE';
      else if (rawMun.includes('MIRANDA')) municipio = 'MIRANDA';
      else if (rawMun.includes('MONAGAS')) municipio = 'MONAGAS';
      else if (rawMun.includes('MELLADO')) municipio = 'MELLADO';
      else if (rawMun.includes('RIBAS')) municipio = 'RIBAS';
      else if (rawMun.includes('RONDON')) municipio = 'RONDON';
      else if (rawMun.includes('SOCORRO')) municipio = 'EL SOCORRO';
      else if (rawMun.includes('CHAGUARAMAS')) municipio = 'CHAGUARAMAS';
      else if (rawMun.includes('GUAYABAL')) municipio = 'GUAYABAL';
      else if (rawMun.includes('CAMAGUAN')) municipio = 'CAMAGUAN';
      else if (rawMun.includes('GUARIBE')) municipio = 'GUARIBE';
      else if (rawMun.includes('ORTIZ')) municipio = 'ORTIZ';
      else if (rawMun.includes('ZARAZA')) municipio = 'ZARAZA';

      const institucionData = {
        municipio,
        nombre: rawNombre,
        codigo: rawCodigo || null,
        turno,
        max_matricula: Math.max(0, parseInt(rawMatricula, 10) || 0),
        max_docentes: Math.max(0, parseInt(rawDocentes, 10) || 0),
        max_administrativo: Math.max(0, parseInt(rawAdmin, 10) || 0),
        max_obreros: Math.max(0, parseInt(rawObreros, 10) || 0),
        max_cocineros: Math.max(0, parseInt(rawCocineros, 10) || 0),
        activo
      };

      try {
        let existente = null;

        // Búsqueda por código si viene especificado
        if (rawCodigo) {
          existente = await Institucion.findOne({ where: { codigo: rawCodigo } });
        }

        // Si no se encuentra por código, buscar por municipio y nombre
        if (!existente) {
          existente = await Institucion.findOne({
            where: {
              municipio,
              nombre: { [Op.iLike]: rawNombre }
            }
          });
        }

        if (existente) {
          await existente.update(institucionData);
          actualizados++;
        } else {
          await Institucion.create(institucionData);
          creados++;
        }
      } catch (rowErr) {
        console.error(`Error en fila ${rowNumber}:`, rowErr);
        ignorados++;
        errores.push(`Fila ${rowNumber} (${rawNombre}): ${rowErr.message}`);
      }
    }

    return res.json({
      ok: true,
      mensaje: `Importación completada: ${creados} planteles creados, ${actualizados} actualizados.`,
      resumen: {
        total: creados + actualizados + ignorados,
        creados,
        actualizados,
        ignorados,
        errores: errores.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error al importar Excel de instituciones:', error);
    return res.status(500).json({ error: 'Error al procesar el archivo Excel de instituciones' });
  }
};

