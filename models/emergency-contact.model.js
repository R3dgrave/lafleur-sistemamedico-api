// models/ContactoEmergencia.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ContactoEmergencia extends Model {
    static associate(models) {
      ContactoEmergencia.belongsTo(models.Paciente, {
        foreignKey: "paciente_id",
      });
    }
  }
  ContactoEmergencia.init(
    {
      contacto_emergencia_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nombre_contacto: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      telefono_contacto: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      relacion_paciente: {
        type: DataTypes.STRING(50),
      },
      fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ContactoEmergencia",
      tableName: "Contactos_Emergencia",
      timestamps: false,
    }
  );
  return ContactoEmergencia;
};
