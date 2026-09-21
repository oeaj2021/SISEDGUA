const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Institucion = sequelize.define('Institucion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  municipio: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  turno: {
    type: DataTypes.ENUM('MAÑANA', 'TARDE', 'AMBOS'),
    allowNull: false,
    defaultValue: 'AMBOS'
  },
  // Capacidad o límites máximos esperados
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
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'instituciones',
  indexes: [
    { fields: ['municipio'] },
    { fields: ['turno'] }
  ]
});

module.exports = Institucion;
