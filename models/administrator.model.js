// models/administrator.model.js
"use strict";
const { Model } = require("sequelize");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class Administrador extends Model {
    static associate(models) {
      Administrador.hasMany(models.Cita, { foreignKey: "administrador_id" });
      Administrador.hasMany(models.HorarioDisponible, {
        foreignKey: "administrador_id",
      });
      Administrador.hasMany(models.ExcepcionDisponibilidad, {
        foreignKey: "administrador_id",
      });
    }

    /**
     * Genera un token de restablecimiento de contraseña.
     * @returns {string} El token sin hashear para enviar al usuario.
     */
    getResetPasswordToken() {
      // Genera un token aleatorio
      const resetToken = crypto.randomBytes(20).toString("hex");

      // Hashea el token y lo guarda en el campo resetPasswordToken
      this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Establece la fecha de expiración del token (1 hora)
      this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

      return resetToken;
    }
  }
  Administrador.init(
    {
      administrador_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "admin",
      },
      profile_picture_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      receive_email_notifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      receive_sms_notifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Administrador",
      tableName: "Administradores",
      timestamps: false,
      hooks: {
        beforeCreate: async (admin) => {
          if (admin.password_hash) {
            admin.password_hash = await bcrypt.hash(admin.password_hash, 10);
          }
        },
        beforeUpdate: async (admin) => {
          if (admin.changed("password_hash") && admin.password_hash) {
            admin.password_hash = await bcrypt.hash(admin.password_hash, 10);
          }
        },
      },
    }
  );

  return Administrador;
};
