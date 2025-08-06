// src/models/physical-examination.model.js
module.exports = (sequelize, DataTypes) => {
  const ExploracionFisica = sequelize.define(
    "ExploracionFisica",
    {
      exploracion_id: {
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
      hallazgos: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      region_explorada: {
        type: DataTypes.STRING(100),
        allowNull: true, // Puede ser nulo si es una exploración general sin región específica
      },
    },
    {
      tableName: "Exploracion_Fisica",
      timestamps: true,
      createdAt: "fecha_registro",
      updatedAt: false,
    }
  );

  ExploracionFisica.associate = (models) => {
    ExploracionFisica.belongsTo(models.HistoriaClinica, {
      foreignKey: "historia_clinica_id",
      as: "HistoriaClinica",
    });
    ExploracionFisica.belongsTo(models.Cita, {
      foreignKey: "cita_id",
      as: "Cita",
    });
  };

  return ExploracionFisica;
};
