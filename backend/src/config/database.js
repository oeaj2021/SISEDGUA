const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'sisedgua',
  process.env.DB_USER || 'sisedgua_admin',
  process.env.DB_PASS || '557f49dc843f5fe53b04c860103b28b0',
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
    timezone: '-04:00', // America/Caracas
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 50,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 10,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      statement_timeout: 10000, // Evita locks y consultas zombis en picos masivos
      idle_in_transaction_session_timeout: 10000
    }
  }
);

module.exports = sequelize;
