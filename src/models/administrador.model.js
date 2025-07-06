const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const Administrador = sequelize.define(
  "Administrador",
  {
    administrador_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fecha_registro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true, // Puede ser nulo si no hay un proceso de restablecimiento activo
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true, // Puede ser nulo si no hay un proceso de restablecimiento activo
    },
  },
  {
    tableName: "Administradores",
    timestamps: false,
  }
);

// Hook para hashear la contraseña antes de crear un nuevo administrador
Administrador.beforeCreate(async (administrador) => {
  if (administrador.password_hash) {
    administrador.password_hash = await bcrypt.hash(
      administrador.password_hash,
      10
    );
  }
});

// Hook para hashear la contraseña antes de actualizarla (si el campo cambia)
Administrador.beforeUpdate(async (administrador, options) => {
  if (administrador.changed("password_hash") && administrador.password_hash) {
    administrador.password_hash = await bcrypt.hash(
      administrador.password_hash,
      10
    );
  }
});

// Método para comparar contraseñas (si no lo tienes ya)
Administrador.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// --- NUEVO MÉTODO PARA GENERAR EL TOKEN DE RESTABLECIMIENTO ---
Administrador.prototype.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  return resetToken;
};

module.exports = Administrador;
