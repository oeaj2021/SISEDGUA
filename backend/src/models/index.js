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

    // 1. Eliminar inmediatamente cualquier trigger residual defectuoso que bloquee los INSERTs
    const cleanupTriggers = [
      'DROP TRIGGER IF EXISTS sync_timestamps_comunales ON registros_consejos_comunales CASCADE;',
      'DROP TRIGGER IF EXISTS sync_timestamps_padron ON padron_personal_educativo CASCADE;',
      'DROP FUNCTION IF EXISTS trg_sync_comunales_timestamps() CASCADE;'
    ];

    for (const sql of cleanupTriggers) {
      try {
        await sequelize.query(sql);
      } catch (err) {
        console.warn('Nota cleanup trigger:', err.message);
      }
    }

    // 2. Asegurar que las columnas físicas en PostgreSQL sean created_at y updated_at
    const statements = [
      'ALTER TABLE IF EXISTS registros_consejos_comunales ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
      'ALTER TABLE IF EXISTS registros_consejos_comunales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
      'ALTER TABLE IF EXISTS padron_personal_educativo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
      'ALTER TABLE IF EXISTS padron_personal_educativo ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();'
    ];

    for (const sql of statements) {
      try {
        await sequelize.query(sql);
      } catch {
        // Silencioso si la tabla aún no fue creada
      }
    }




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
  CapacidadMunicipio,
  RegistroConsejoComunal,
  PadronPersonal,
  syncDatabase
};
