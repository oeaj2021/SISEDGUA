const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CapacidadMunicipio = sequelize.define('CapacidadMunicipio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  municipio: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  turno: {
    type: DataTypes.ENUM('MAÑANA', 'TARDE'),
    allowNull: false
  },
  max_matricula: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  max_docentes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  max_administrativo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  max_obreros: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  max_cocineros: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'capacidades_municipio',
  indexes: [
    {
      unique: true,
      fields: ['municipio', 'turno']
    }
  ]
});

module.exports = CapacidadMunicipio;
