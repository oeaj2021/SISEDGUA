const sequelize = require('../config/database');
const Reporte = require('./Reporte');
const Admin = require('./Admin');
const Institucion = require('./Institucion');

Reporte.belongsTo(Institucion, { foreignKey: 'institucion_id', as: 'institucion' });
Institucion.hasMany(Reporte, { foreignKey: 'institucion_id', as: 'reportes' });

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida con éxito.');
    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas con PostgreSQL.');
  } catch (error) {
    console.error('❌ Error al sincronizar con PostgreSQL:', error.message);
  }
};

module.exports = {
  sequelize,
  Reporte,
  Admin,
  Institucion,
  syncDatabase
};
