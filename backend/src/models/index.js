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

    // Migración defensiva idempotente para asegurar nombres de columnas snake_case
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registros_consejos_comunales') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_consejos_comunales' AND column_name = 'created_at') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_consejos_comunales' AND column_name = 'createdAt') THEN
                ALTER TABLE registros_consejos_comunales RENAME COLUMN "createdAt" TO created_at;
              ELSE
                ALTER TABLE registros_consejos_comunales ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
              END IF;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_consejos_comunales' AND column_name = 'updated_at') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_consejos_comunales' AND column_name = 'updatedAt') THEN
                ALTER TABLE registros_consejos_comunales RENAME COLUMN "updatedAt" TO updated_at;
              ELSE
                ALTER TABLE registros_consejos_comunales ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
              END IF;
            END IF;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'padron_personal_educativo') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'padron_personal_educativo' AND column_name = 'created_at') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'padron_personal_educativo' AND column_name = 'createdAt') THEN
                ALTER TABLE padron_personal_educativo RENAME COLUMN "createdAt" TO created_at;
              ELSE
                ALTER TABLE padron_personal_educativo ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
              END IF;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'padron_personal_educativo' AND column_name = 'updated_at') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'padron_personal_educativo' AND column_name = 'updatedAt') THEN
                ALTER TABLE padron_personal_educativo RENAME COLUMN "updatedAt" TO updated_at;
              ELSE
                ALTER TABLE padron_personal_educativo ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
              END IF;
            END IF;
          END IF;
        END $$;
      `);
    } catch (migErr) {
      console.warn('⚠️ Nota de migración de esquema de timestamps:', migErr.message);
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
