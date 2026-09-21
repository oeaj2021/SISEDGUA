const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'sisedgua',
  process.env.DB_USER || 'sisedgua_user',
  process.env.DB_PASS || 'sisedgua_pass',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    timezone: '-04:00' // America/Caracas
  }
);

module.exports = sequelize;
