const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mizan_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',

    logging: false,

    define: {
      timestamps: false,
      underscored: true
    },

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();

    console.log('========================================');
    console.log(' PostgreSQL + Sequelize');
    console.log(' Connexion établie avec succès');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Erreur connexion PostgreSQL :');
    console.error(error.message);

    throw error;
  }
};

module.exports = {
  sequelize,
  connectDatabase
};