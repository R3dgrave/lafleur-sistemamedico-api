// src/config/sequelize.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

const env = process.env.NODE_ENV || "development";
const config = require("../../config/config.js")[env];

// Inicializa Sequelize usando la configuración
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    dialectOptions: config.dialectOptions,
  }
);

// Importar los modelos a través del index.js generado por sequelize-cli
// Este `db` contendrá sequelize, Sequelize, y todos tus modelos (db.Administrador, db.Paciente, etc.)
const db = require("../../models");

// Autenticar la conexión
async function connectDB() {
  try {
    await db.sequelize.authenticate(); // Usa db.sequelize
    console.log(
      "Conexión a la base de datos establecida correctamente con Sequelize."
    );

    // **IMPORTANTE: Elimina sequelize.sync({ force: true }); de aquí**
    // Si estás usando sequelize-cli para migraciones, la gestión del esquema
    // se hará con `npx sequelize-cli db:migrate`.
    // Si todavía estás en desarrollo y quieres el auto-sync con seeding:
    // const seedDatabase = require('../../src/seeders/seed'); // Ajusta la ruta
    // await db.sequelize.sync({ force: true });
    // console.log("Modelos sincronizados con la base de datos.");
    // await seedDatabase();
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error);
    process.exit(1);
  }
}

module.exports = { sequelize: db.sequelize, connectDB, db };
