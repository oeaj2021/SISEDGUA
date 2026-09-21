const { Institucion } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { municipio } = req.query;
    const where = { activo: true };
    if (municipio) {
      where.municipio = municipio.toUpperCase();
    }

    const instituciones = await Institucion.findAll({
      where,
      order: [['municipio', 'ASC'], ['nombre', 'ASC']],
      attributes: ['id', 'municipio', 'nombre', 'codigo']
    });

    return res.json(instituciones);
  } catch (error) {
    console.error('Error al obtener instituciones:', error);
    return res.status(500).json({ error: 'Error al consultar catálogo de instituciones' });
  }
};

exports.create = async (req, res) => {
  try {
    const { municipio, nombre, codigo } = req.body;
    if (!municipio || !nombre) {
      return res.status(400).json({ error: 'Municipio y Nombre son requeridos' });
    }

    const nueva = await Institucion.create({
      municipio: municipio.toUpperCase(),
      nombre: nombre.trim(),
      codigo: codigo ? codigo.trim() : null
    });

    return res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear institución:', error);
    return res.status(500).json({ error: 'Error al registrar institución' });
  }
};
