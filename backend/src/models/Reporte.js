const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reporte = sequelize.define('Reporte', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  turno: {
    type: DataTypes.ENUM('MAÑANA', 'TARDE'),
    allowNull: false
  },
  municipio: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  nombre_director: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  cedula: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  nombre_institucion: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  institucion_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  es_institucion_manual: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matricula_asistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  matricula_inasistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  docentes_asistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  docentes_inasistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  admin_asistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  admin_inasistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  obrero_asistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  obrero_inasistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  cocina_asistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  cocina_inasistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  incidencias: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'reportes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['fecha'] },
    { fields: ['turno'] },
    { fields: ['nombre_institucion'] },
    { fields: ['fecha', 'turno'] },
    { fields: ['fecha', 'turno', 'nombre_institucion'] },
    { fields: ['fecha', 'institucion_id', 'turno'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Reporte;
