// models/TipoAtencion.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TipoAtencion extends Model {
    static associate(models) {
      TipoAtencion.hasMany(models.Cita, { foreignKey: "tipo_atencion_id" });
    }
  }
  TipoAtencion.init(
    {
      tipo_atencion_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_atencion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
      },
      buffer_minutos: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "TipoAtencion",
      tableName: "Tipo_Atencion",
      timestamps: false,
    }
  );
  return TipoAtencion;
};
