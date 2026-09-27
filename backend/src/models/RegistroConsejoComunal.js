const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RegistroConsejoComunal = sequelize.define('RegistroConsejoComunal', {
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
  telefono: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  genero: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo_personal: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tipo_personal_detalle: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  institucion_educativa: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: null
  },
  municipio: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  parroquia: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  comunidad: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  circuito_comunal: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  comuna: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  participa_asambleas: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  forma_parte_comite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  comite: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  comite_detalle: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  ip_registro: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'registros_consejos_comunales',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['nacionalidad', 'cedula'],
      name: 'unique_nacionalidad_cedula_comunales'
    },
    { fields: ['municipio'] },
    { fields: ['parroquia'] }
  ]
});

module.exports = RegistroConsejoComunal;
