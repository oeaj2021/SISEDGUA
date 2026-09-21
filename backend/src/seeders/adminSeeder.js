require('dotenv').config();
const { Admin, syncDatabase } = require('../models');

async function seedAdmin() {
  try {
    await syncDatabase();
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@sisedgua.ve';
    const adminPass = process.env.DEFAULT_ADMIN_PASS || 'Admin2026!';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'Administrador Zona Educativa';

    const [admin, created] = await Admin.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        email: adminEmail,
        password: adminPass,
        nombre: adminName
      }
    });

    if (created) {
      console.log(`✅ Usuario Administrador inicial creado exitosamente: ${adminEmail}`);
    } else {
      console.log(`ℹ️ Usuario Administrador ya existe: ${adminEmail}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed de Admin:', error);
    process.exit(1);
  }
}

seedAdmin();
