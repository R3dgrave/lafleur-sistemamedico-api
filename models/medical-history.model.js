// src/models/medical-history.model.js
module.exports = (sequelize, DataTypes) => {
  const HistoriaClinica = sequelize.define(
    "HistoriaClinica",
    {
      historia_clinica_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Un paciente solo puede tener una historia clínica general
        references: {
          model: "Pacientes",
          key: "paciente_id",
        },
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ultima_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Historia_Clinica",
      timestamps: true,
      createdAt: "fecha_creacion",
      updatedAt: "ultima_actualizacion",
    }
  );

  HistoriaClinica.associate = (models) => {
    // Una Historia Clínica pertenece a un Paciente
    HistoriaClinica.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "Paciente",
    });

    // Una Historia Clínica puede tener muchas Anamnesis
    HistoriaClinica.hasMany(models.Anamnesis, {
      foreignKey: "historia_clinica_id",
      as: "Anamnesis",
    });

    // Una Historia Clínica puede tener muchas Exploraciones Físicas
    HistoriaClinica.hasMany(models.ExploracionFisica, {
      foreignKey: "historia_clinica_id",
      as: "ExploracionesFisicas",
    });

    // Una Historia Clínica puede tener muchos Diagnósticos
    HistoriaClinica.hasMany(models.Diagnostico, {
      foreignKey: "historia_clinica_id",
      as: "Diagnosticos",
    });

    // Una Historia Clínica puede tener muchos Planes de Tratamiento
    HistoriaClinica.hasMany(models.PlanTratamiento, {
      foreignKey: "historia_clinica_id",
      as: "PlanesTratamiento",
    });

    // Una Historia Clínica puede tener muchas Pruebas Iniciales
    HistoriaClinica.hasMany(models.PruebasIniciales, {
      foreignKey: "historia_clinica_id",
      as: "PruebasIniciales",
    });
  };

  return HistoriaClinica;
};
