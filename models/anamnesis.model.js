// src/models/anamnesis.model.js
module.exports = (sequelize, DataTypes) => {
  const Anamnesis = sequelize.define(
    "Anamnesis",
    {
      anamnesis_id: {
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
      motivo_consulta: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      antecedentes_personales: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      antecedentes_familiares: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      medicamentos_actuales: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      alergias: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      aqx: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      amp: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      habitos_tabaco: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      habitos_alcohol: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      habitos_alimentacion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      otros_antecedentes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "Anamnesis",
      timestamps: true,
      createdAt: "fecha_registro",
      updatedAt: false,
    }
  );

  Anamnesis.associate = (models) => {
    // Una Anamnesis pertenece a una Historia Clínica
    Anamnesis.belongsTo(models.HistoriaClinica, {
      foreignKey: "historia_clinica_id",
      as: "HistoriaClinica",
    });

    // Una Anamnesis puede estar vinculada a una Cita (opcional)
    Anamnesis.belongsTo(models.Cita, {
      foreignKey: "cita_id",
      as: "Cita",
    });
  };

  return Anamnesis;
};
