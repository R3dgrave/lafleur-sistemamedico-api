// src/models/diagnosis.model.js
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Diagnostico extends Model {
    static associate(models) {
      // Un Diagnostico pertenece a una HistoriaClinica
      Diagnostico.belongsTo(models.HistoriaClinica, {
        foreignKey: "historia_clinica_id",
        as: "HistoriaClinica",
      });
      // Un Diagnostico pertenece a una Cita (opcionalmente)
      Diagnostico.belongsTo(models.Cita, {
        foreignKey: "cita_id",
        as: "Cita",
        allowNull: true,
      });
    }
  }
  Diagnostico.init(
    {
      diagnostico_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      historia_clinica_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Historia_Clinica",
          key: "historia_clinica_id",
        },
      },
      cita_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Citas",
          key: "cita_id",
        },
      },
      fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      codigo_cie: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      nombre_diagnostico: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      es_principal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      estado_diagnostico: {
        type: DataTypes.ENUM("Activo", "Resuelto", "Crónico", "Inactivo"),
        allowNull: false,
        defaultValue: "Activo",
      },
    },
    {
      sequelize,
      modelName: "Diagnostico",
      tableName: "Diagnosticos",
      timestamps: false,
    }
  );
  return Diagnostico;
};
