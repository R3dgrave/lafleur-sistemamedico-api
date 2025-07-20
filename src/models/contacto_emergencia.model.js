const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const Paciente = require('./paciente.model');

const ContactoEmergencia = sequelize.define('ContactoEmergencia', {
    contacto_emergencia_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Paciente,
            key: 'paciente_id'
        }
    },
    nombre_contacto: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    telefono_contacto: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    relacion_paciente: {
        type: DataTypes.STRING(50)
    },
    fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Contactos_Emergencia',
    timestamps: false
});

module.exports = ContactoEmergencia;