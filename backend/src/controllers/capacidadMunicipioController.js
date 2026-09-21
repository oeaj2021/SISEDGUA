const { CapacidadMunicipio } = require('../models');

const MUNICIPIOS_OFICIALES = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

exports.getAll = async (req, res) => {
  try {
    const { municipio, turno } = req.query;
    const where = {};

    if (municipio) where.municipio = municipio.toUpperCase();
    if (turno && ['MAÑANA', 'TARDE'].includes(turno)) where.turno = turno;

    // Asegurar que existan registros base para todos los municipios y turnos
    const capacidades = await CapacidadMunicipio.findAll({
      where,
      order: [['municipio', 'ASC'], ['turno', 'ASC']]
    });

    return res.json(capacidades);
  } catch (error) {
    console.error('Error al consultar capacidades por municipio:', error);
    return res.status(500).json({ error: 'Error al consultar capacidades por municipio' });
  }
};

// Crear o actualizar (upsert) la capacidad máxima de un municipio para un turno dado
exports.saveCapacidad = async (req, res) => {
  try {
    const {
      municipio,
      turno,
      max_matricula,
      max_docentes,
      max_administrativo,
      max_obreros,
      max_cocineros
    } = req.body;

    if (!municipio || !turno) {
      return res.status(400).json({ error: 'Municipio y Turno son obligatorios' });
    }

    const munNormalizado = municipio.toUpperCase().trim();
    if (!MUNICIPIOS_OFICIALES.includes(munNormalizado)) {
      return res.status(400).json({ error: 'Municipio no válido' });
    }

    if (!['MAÑANA', 'TARDE'].includes(turno)) {
      return res.status(400).json({ error: 'Turno debe ser MAÑANA o TARDE' });
    }

    const [registro, created] = await CapacidadMunicipio.findOrCreate({
      where: {
        municipio: munNormalizado,
        turno
      },
      defaults: {
        municipio: munNormalizado,
        turno,
        max_matricula: parseInt(max_matricula || 0, 10),
        max_docentes: parseInt(max_docentes || 0, 10),
        max_administrativo: parseInt(max_administrativo || 0, 10),
        max_obreros: parseInt(max_obreros || 0, 10),
        max_cocineros: parseInt(max_cocineros || 0, 10)
      }
    });

    if (!created) {
      await registro.update({
        max_matricula: parseInt(max_matricula !== undefined ? max_matricula : registro.max_matricula, 10),
        max_docentes: parseInt(max_docentes !== undefined ? max_docentes : registro.max_docentes, 10),
        max_administrativo: parseInt(max_administrativo !== undefined ? max_administrativo : registro.max_administrativo, 10),
        max_obreros: parseInt(max_obreros !== undefined ? max_obreros : registro.max_obreros, 10),
        max_cocineros: parseInt(max_cocineros !== undefined ? max_cocineros : registro.max_cocineros, 10)
      });
    }

    return res.json({
      ok: true,
      mensaje: created ? 'Capacidad municipal registrada' : 'Capacidad municipal actualizada',
      data: registro
    });
  } catch (error) {
    console.error('Error al guardar capacidad municipal:', error);
    return res.status(500).json({ error: 'Error al registrar capacidad del municipio' });
  }
};

// Carga masiva o inicialización para todos los municipios
exports.inicializarMunicipios = async (req, res) => {
  try {
    let creados = 0;
    for (const mun of MUNICIPIOS_OFICIALES) {
      for (const t of ['MAÑANA', 'TARDE']) {
        const [, created] = await CapacidadMunicipio.findOrCreate({
          where: { municipio: mun, turno: t },
          defaults: {
            municipio: mun,
            turno: t,
            max_matricula: 0,
            max_docentes: 0,
            max_administrativo: 0,
            max_obreros: 0,
            max_cocineros: 0
          }
        });
        if (created) creados++;
      }
    }
    return res.json({ ok: true, creados });
  } catch (error) {
    console.error('Error al inicializar municipios:', error);
    return res.status(500).json({ error: 'Error al inicializar municipios' });
  }
};
