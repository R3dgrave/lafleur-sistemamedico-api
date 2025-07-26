// models/Administrador.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Administrador extends Model {
    static associate(models) {
      Administrador.hasMany(models.Cita, { foreignKey: "administrador_id" });
      Administrador.hasMany(models.HorarioDisponible, {
        foreignKey: "administrador_id",
      });
      Administrador.hasMany(models.ExcepcionDisponibilidad, {
        foreignKey: "administrador_id",
      });
    }
  }
  Administrador.init(
    {
      administrador_id: {
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
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Administrador",
      tableName: "Administradores",
      timestamps: false,
    }
  );
  return Administrador;
};
