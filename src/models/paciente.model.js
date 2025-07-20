const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Paciente = sequelize.define('Paciente', {
    paciente_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    genero: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    identidad_genero: {
        type: DataTypes.STRING(50)
    },
    sexo_registral: {
        type: DataTypes.STRING(20)
    },
    telefono: {
        type: DataTypes.STRING(20)
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    direccion: {
        type: DataTypes.STRING(255)
    },
    rut: {
        type: DataTypes.STRING(20),
        unique: true
    },
    fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Pacientes',
    timestamps: false
});

module.exports = Paciente;