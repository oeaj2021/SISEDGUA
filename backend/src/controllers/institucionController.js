const { Institucion } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { municipio, turno, search } = req.query;
    const where = { activo: true };

    if (municipio) {
      where.municipio = municipio.toUpperCase();
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
