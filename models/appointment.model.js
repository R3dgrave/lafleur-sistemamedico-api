// models/appointment.model.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cita extends Model {
    static associate(models) {
      Cita.belongsTo(models.Paciente, { foreignKey: 'paciente_id' });
      Cita.belongsTo(models.TipoAtencion, { foreignKey: 'tipo_atencion_id' });
      Cita.belongsTo(models.Administrador, { foreignKey: 'administrador_id' });
    }
  }
  Cita.init({
    cita_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    paciente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo_atencion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_hora_cita: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estado_cita: {
      type: DataTypes.STRING(50),
      defaultValue: "Pendiente",
      allowNull: false,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    administrador_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Cita',
    tableName: 'Citas',
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    //Definición de índices únicos compuestos**
    indexes: [
      {
        unique: true,
        fields: ['fecha_hora_cita', 'administrador_id'],
        name: 'unique_cita_admin_time'
      },
      {
        unique: true,
        fields: ['fecha_hora_cita', 'paciente_id'],
        name: 'unique_cita_patient_time'
      }
    ]
  });
  return Cita;
};