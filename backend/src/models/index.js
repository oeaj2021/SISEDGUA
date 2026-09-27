const sequelize = require('../config/database');
const Reporte = require('./Reporte');
const Admin = require('./Admin');
const Institucion = require('./Institucion');
const CapacidadMunicipio = require('./CapacidadMunicipio');
const RegistroConsejoComunal = require('./RegistroConsejoComunal');
const PadronPersonal = require('./PadronPersonal');

Reporte.belongsTo(Institucion, { foreignKey: 'institucion_id', as: 'institucion' });
Institucion.hasMany(Reporte, { foreignKey: 'institucion_id', as: 'reportes' });

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida con éxito.');
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Tablas sincronizadas con PostgreSQL (Modo Desarrollo/Staging).');
    } else {
      console.log('ℹ️ Modo producción detectado: alter sync omitido para preservar integridad DDL.');
    }
  } catch (error) {
    console.error('❌ Error al sincronizar con PostgreSQL:', error.message);
  }
};

module.exports = {
  sequelize,
  Reporte,
  Admin,
  Institucion,
  CapacidadMunicipio,
  RegistroConsejoComunal,
  PadronPersonal,
  syncDatabase
};
