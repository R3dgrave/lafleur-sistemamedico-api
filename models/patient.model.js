// models/patient.model.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Paciente extends Model {
    static associate(models) {
      Paciente.hasMany(models.ContactoEmergencia, {
        foreignKey: "paciente_id",
        onDelete: "CASCADE",
      });
      Paciente.hasMany(models.Cita, { foreignKey: "paciente_id" });
    }
  }
  Paciente.init(
    {
      paciente_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      genero: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      identidad_genero: {
        type: DataTypes.STRING(50),
      },
      sexo_registral: {
        type: DataTypes.STRING(20),
      },
      telefono: {
        type: DataTypes.STRING(20),
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      direccion: {
        type: DataTypes.STRING(255),
      },
      rut: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: true,
      },
      fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Paciente",
      tableName: "Pacientes",
      timestamps: false,
    }
  );
  return Paciente;
};
