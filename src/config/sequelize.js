const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false, // Puedes cambiar a console.log para ver las queries SQL
    //dialectOptions: {
    //ssl: {
    //require: true,
    //rejectUnauthorized: false, // Considera usar un certificado si estás en producción
    //},
    //},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Autenticar la conexión
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log(
      "Conexión a la base de datos establecida correctamente con Sequelize."
    );
    require("../models");
    await sequelize.sync({ alter: true }); // O { force: true } si estás seguro de querer borrar datos
    console.log("Modelos sincronizados con la base de datos.");
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
