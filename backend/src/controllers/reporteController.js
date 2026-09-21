const { Reporte, Institucion } = require('../models');

const MUNICIPIOS_VALIDOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

exports.create = async (req, res) => {
  try {
    const {
      turno,
      municipio,
      fecha,
      nombre_director,
      cedula,
      telefono,
      nombre_institucion,
      institucion_id,
      matricula_asistente,
      matricula_inasistente,
      docentes_asistente,
      docentes_inasistente,
      admin_asistente,
      admin_inasistente,
      obrero_asistente,
      obrero_inasistente,
      cocina_asistente,
      cocina_inasistente,
      incidencias
    } = req.body;

    if (!['MAÑANA', 'TARDE'].includes(turno)) {
      return res.status(400).json({ error: 'El turno debe ser MAÑANA o TARDE' });
    }

    if (!Array.isArray(municipio) || municipio.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un municipio válido' });
    }

    const munsNormalizados = municipio.map(m => m.toUpperCase().trim());
    const invalidos = munsNormalizados.filter(m => !MUNICIPIOS_VALIDOS.includes(m));
    if (invalidos.length > 0) {
      return res.status(400).json({ error: `Municipios no válidos: ${invalidos.join(', ')}` });
    }

    if (!fecha || !nombre_director || !cedula || !telefono || !nombre_institucion || !incidencias) {
      return res.status(400).json({ error: 'Todos los campos requeridos deben ser completados' });
    }

    const es_manual = !institucion_id;

    const reporte = await Reporte.create({
      turno,
      municipio: munsNormalizados,
      fecha,
      nombre_director: nombre_director.trim(),
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      nombre_institucion: nombre_institucion.trim(),
      institucion_id: institucion_id ? parseInt(institucion_id, 10) : null,
      es_institucion_manual: es_manual,
      matricula_asistente: parseInt(matricula_asistente || 0, 10),
      matricula_inasistente: parseInt(matricula_inasistente || 0, 10),
      docentes_asistente: parseInt(docentes_asistente || 0, 10),
      docentes_inasistente: parseInt(docentes_inasistente || 0, 10),
      admin_asistente: parseInt(admin_asistente || 0, 10),
      admin_inasistente: parseInt(admin_inasistente || 0, 10),
      obrero_asistente: parseInt(obrero_asistente || 0, 10),
      obrero_inasistente: parseInt(obrero_inasistente || 0, 10),
      cocina_asistente: parseInt(cocina_asistente || 0, 10),
      cocina_inasistente: parseInt(cocina_inasistente || 0, 10),
      incidencias: incidencias.trim()
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Reporte registrado exitosamente',
      id: reporte.id
    });
  } catch (error) {
    console.error('Error al guardar el reporte:', error);
    return res.status(500).json({ error: 'Ocurrió un error en el servidor al registrar el reporte' });
  }
};

exports.checkDuplicado = async (req, res) => {
  try {
    const { nombre_institucion, fecha, turno } = req.query;
    if (!nombre_institucion || !fecha || !turno) {
      return res.json({ duplicado: false });
    }

    const existe = await Reporte.findOne({
      where: {
        nombre_institucion: nombre_institucion.trim(),
        fecha,
        turno
      }
    });

    return res.json({ duplicado: !!existe });
  } catch (error) {
    console.error('Error al chequear duplicado:', error);
    return res.status(500).json({ error: 'Error al verificar duplicado' });
  }
};
