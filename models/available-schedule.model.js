// models/HorarioDisponible.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HorarioDisponible extends Model {
    static associate(models) {
      HorarioDisponible.belongsTo(models.Administrador, {
        foreignKey: "administrador_id",
      });
    }
  }
  HorarioDisponible.init(
    {
      horario_disponible_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      administrador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dia_semana: {
        // 0=Domingo, 1=Lunes, ..., 6=Sábado
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 6,
        },
      },
      hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: DataTypes.TIME,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "HorarioDisponible",
      tableName: "Horarios_Disponibles",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["administrador_id", "dia_semana", "hora_inicio", "hora_fin"],
        },
      ],
    }
  );
  return HorarioDisponible;
};
