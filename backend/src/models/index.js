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

    // Migración defensiva idempotente: garantiza la existencia física de ambas columnas (snake_case y camelCase)
    // y mantiene su sincronización mediante triggers automáticos para evitar errores bajo cualquier ORM o consulta
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          -- Función de sincronización bidireccional entre camelCase y snake_case
          CREATE OR REPLACE FUNCTION trg_sync_comunales_timestamps()
          RETURNS TRIGGER AS $func$
          BEGIN
            IF NEW.created_at IS NOT NULL AND NEW."createdAt" IS NULL THEN
              NEW."createdAt" := NEW.created_at;
            ELSIF NEW."createdAt" IS NOT NULL AND NEW.created_at IS NULL THEN
              NEW.created_at := NEW."createdAt";
            END IF;
            IF NEW.updated_at IS NOT NULL AND NEW."updatedAt" IS NULL THEN
              NEW."updatedAt" := NEW.updated_at;
            ELSIF NEW."updatedAt" IS NOT NULL AND NEW.updated_at IS NULL THEN
              NEW.updated_at := NEW."updatedAt";
            END IF;
            RETURN NEW;
          END;
          $func$ LANGUAGE plpgsql;

          -- Tabla registros_consejos_comunales
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registros_consejos_comunales') THEN
            ALTER TABLE registros_consejos_comunales ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            ALTER TABLE registros_consejos_comunales ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            ALTER TABLE registros_consejos_comunales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            ALTER TABLE registros_consejos_comunales ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

            UPDATE registros_consejos_comunales SET "createdAt" = created_at WHERE "createdAt" IS NULL AND created_at IS NOT NULL;
            UPDATE registros_consejos_comunales SET created_at = "createdAt" WHERE created_at IS NULL AND "createdAt" IS NOT NULL;
            UPDATE registros_consejos_comunales SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL AND updated_at IS NOT NULL;
            UPDATE registros_consejos_comunales SET updated_at = "updatedAt" WHERE updated_at IS NULL AND "updatedAt" IS NOT NULL;

            DROP TRIGGER IF EXISTS sync_timestamps_comunales ON registros_consejos_comunales;
            CREATE TRIGGER sync_timestamps_comunales
            BEFORE INSERT OR UPDATE ON registros_consejos_comunales
            FOR EACH ROW EXECUTE FUNCTION trg_sync_comunales_timestamps();
          END IF;

          -- Tabla padron_personal_educativo
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'padron_personal_educativo') THEN
            ALTER TABLE padron_personal_educativo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            ALTER TABLE padron_personal_educativo ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            ALTER TABLE padron_personal_educativo ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            ALTER TABLE padron_personal_educativo ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

            UPDATE padron_personal_educativo SET "createdAt" = created_at WHERE "createdAt" IS NULL AND created_at IS NOT NULL;
            UPDATE padron_personal_educativo SET created_at = "createdAt" WHERE created_at IS NULL AND "createdAt" IS NOT NULL;
            UPDATE padron_personal_educativo SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL AND updated_at IS NOT NULL;
            UPDATE padron_personal_educativo SET updated_at = "updatedAt" WHERE updated_at IS NULL AND "updatedAt" IS NOT NULL;

            DROP TRIGGER IF EXISTS sync_timestamps_padron ON padron_personal_educativo;
            CREATE TRIGGER sync_timestamps_padron
            BEFORE INSERT OR UPDATE ON padron_personal_educativo
            FOR EACH ROW EXECUTE FUNCTION trg_sync_comunales_timestamps();
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
