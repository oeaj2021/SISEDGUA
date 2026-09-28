const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PadronPersonal = sequelize.define('PadronPersonal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nacionalidad: {
    type: DataTypes.STRING(2),
    allowNull: false,
    defaultValue: 'V',
    validate: {
      isIn: [['V', 'E']]
    }
  },
  cedula: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  nombres_apellidos: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  tipo_personal: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Docente'
  },
  municipio: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'padron_personal_educativo',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['nacionalidad', 'cedula'],
      name: 'unique_padron_cedula'
    },
    { fields: ['municipio'] }
  ]
});

module.exports = PadronPersonal;
