const db = require("../models");
const Administrador = db.Administrador;
const { hashPassword, comparePassword } = require("../utils/hash");
const transporter = require("../config/nodemailer");
const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const {
  loginSchema,
  administradorSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} = require("../utils/validation");

const REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS = parseInt(
  process.env.REFRESH_TOKEN_EXPIRATION_DAYS || "7",
  10
);

const registerAdmin = async (req, res, next) => {
  try {
    const validatedData = administradorSchema.parse(req.body);
    const { nombre, apellido, email, password_hash } = validatedData;
    const hashedPassword = await hashPassword(password_hash);

    const newAdmin = await Administrador.create({
      nombre,
      apellido,
      email,
      password_hash: hashedPassword,
    });

    res.status(201).json({
      message: "Administrador registrado exitosamente",
      user: newAdmin,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "El email ya está registrado." });
    }
    next(error);
  }
};

const loginAdmin = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password_hash } = validatedData;

    const admin = await Administrador.findOne({ where: { email } });

    if (
      !admin ||
      !(await comparePassword(password_hash, admin.password_hash))
    ) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const accessToken = generateAccessToken({
      id: admin.administrador_id,
      email: admin.email,
    });

    const refreshToken = generateRefreshToken(admin.administrador_id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      accessToken,
      user: {
        id: admin.administrador_id,
        nombre: admin.nombre,
        email: admin.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logoutAdmin = async (req, res, next) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Sesión cerrada exitosamente." });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh Token no encontrado en las cookies." });
    }

    const decoded = verifyRefreshToken(oldRefreshToken);
    if (!decoded || !decoded.id) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res
        .status(401)
        .json({ message: "Refresh Token inválido o expirado." });
    }

    const administradorId = decoded.id;

    const newAccessToken = generateAccessToken({ id: administradorId });

    const newRefreshToken = generateRefreshToken(administradorId);
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Token de acceso refrescado exitosamente",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Error al refrescar el token:", error.message);
    res
      .status(401)
      .json({ message: "No se pudo refrescar el token de autenticación." });
  }
};

const getAuthenticatedUser = async (req, res, next) => {
  try {
    if (req.user) {
      return res.status(200).json({
        email: req.user.email,
        nombre: req.user.nombre || "Usuario",
      });
    } else {
      return res
        .status(401)
        .json({ message: "No se encontró información de usuario." });
    }
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  let administrador;
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    administrador = await Administrador.findOne({ where: { email } });

    if (!administrador) {
      return res.status(200).json({
        message:
          "Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña.",
      });
    }

    const resetToken = administrador.getResetPasswordToken();
    await administrador.save({
      fields: ["resetPasswordToken", "resetPasswordExpires"],
    });

    const resetUrl = `${process.env.FRONTEND_URL}/restablecer-contrasena/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: administrador.email,
      subject: "Restablecimiento de Contraseña",
      html: `
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Por favor, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <p><a href="${resetUrl}">Restablecer Contraseña</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste un restablecimiento de contraseña, ignora este correo electrónico.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message:
        "Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña.",
    });
  } catch (error) {
    console.error("Error al solicitar restablecimiento de contraseña:", error);
    if (administrador) {
      administrador.resetPasswordToken = null;
      administrador.resetPasswordExpires = null;
      await administrador.save();
    }
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const validatedData = changePasswordSchema.parse(req.body);
    const { password_hash } = validatedData;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const administrador = await Administrador.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [require("sequelize").Op.gt]: Date.now() },
      },
    });

    if (!administrador) {
      return res
        .status(400)
        .json({ message: "Token de restablecimiento inválido o expirado." });
    }

    if (administrador) {
      administrador.password_hash = password_hash;
      administrador.resetPasswordToken = null;
      administrador.resetPasswordExpires = null;
      await administrador.save();
    }

    res.status(200).json({ message: "Contraseña restablecida exitosamente." });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    next(error);
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getAuthenticatedUser,
  forgotPassword,
  resetPassword,
};
