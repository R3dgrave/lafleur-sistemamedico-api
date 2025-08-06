const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlanTratamiento = sequelize.define('PlanTratamiento', {
    plan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    historia_clinica_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Historia_Clinica', 
        key: 'historia_clinica_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    cita_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Citas',
        key: 'cita_id',
      },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL',
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    descripcion_plan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    medicamentos_recetados: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    indicaciones_adicionales: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    proxima_cita_recomendada: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    receta_adjunta_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    tableName: 'Plan_Tratamiento',
    timestamps: false,
  });

  PlanTratamiento.associate = (models) => {
    PlanTratamiento.belongsTo(models.HistoriaClinica, {
      foreignKey: 'historia_clinica_id',
      as: 'HistoriaClinica',
    });
    PlanTratamiento.belongsTo(models.Cita, {
      foreignKey: 'cita_id',
      as: 'Cita',
    });
  };

  return PlanTratamiento;
};
