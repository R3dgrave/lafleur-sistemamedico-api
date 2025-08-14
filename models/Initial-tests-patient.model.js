// src/models/initial-test-patient.js
module.exports = (sequelize, DataTypes) => {
  const PruebasIniciales = sequelize.define(
    "PruebasIniciales",
    {
      prueba_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      historia_clinica_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cita_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      peso: {
        type: DataTypes.DECIMAL(5, 2), // 999.99 kg
        allowNull: false,
      },
      altura: {
        type: DataTypes.DECIMAL(4, 2), // 9.99 m
        allowNull: true,
      },
      imc: {
        type: DataTypes.DECIMAL(4, 2), // 99.99
        allowNull: true,
      },
      perimetro_cintura: {
        type: DataTypes.DECIMAL(5, 2), // 999.99 cm
        allowNull: true,
      },
      perimetro_cadera: {
        type: DataTypes.DECIMAL(5, 2), // 999.99 cm
        allowNull: true,
      },
      presion_sistolica: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      presion_diastolica: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      frecuencia_cardiaca: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      temperatura: {
        type: DataTypes.DECIMAL(3, 1), // 99.9 °C
        allowNull: true,
      },
      saturacion_oxigeno: {
        type: DataTypes.DECIMAL(4, 2), // 99.99 %
        allowNull: true,
      },
      notas_adicionales: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "Pruebas_Iniciales",
      timestamps: true,
      createdAt: "fecha_registro",
      updatedAt: false,
    }
  );

  PruebasIniciales.associate = (models) => {
    PruebasIniciales.belongsTo(models.HistoriaClinica, {
      foreignKey: "historia_clinica_id",
      as: "HistoriaClinica",
    });

    PruebasIniciales.belongsTo(models.Cita, {
      foreignKey: "cita_id",
      as: "Cita",
    });
  };

  return PruebasIniciales;
};
