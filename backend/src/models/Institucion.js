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
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'instituciones',
  indexes: [
    { fields: ['municipio'] }
  ]
});

module.exports = Institucion;
