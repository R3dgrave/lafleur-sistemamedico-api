// models/exception_availability.model.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ExcepcionDisponibilidad extends Model {
    static associate(models) {
      ExcepcionDisponibilidad.belongsTo(models.Administrador, {
        foreignKey: "administrador_id",
      });
    }
  }
  ExcepcionDisponibilidad.init(
    {
      excepcion_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      administrador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      hora_inicio_bloqueo: {
        type: DataTypes.TIME,
      },
      hora_fin_bloqueo: {
        type: DataTypes.TIME,
      },
      es_dia_completo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      descripcion: {
        type: DataTypes.STRING(255),
      },
    },
    {
      sequelize,
      modelName: "ExcepcionDisponibilidad",
      tableName: "Excepciones_Disponibilidad",
      timestamps: false,
    }
  );
  return ExcepcionDisponibilidad;
};
