const { Administrador } = require("../models"); // Ya no importamos RefreshToken
const { hashPassword, comparePassword } = require("../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken, // Usamos la nueva función sin guardar en DB
  verifyRefreshToken, // Usamos la nueva función para verificar RT
} = require("../utils/jwt");
const { loginSchema, administradorSchema } = require("../utils/validation"); // Asume que tienes un loginSchema en Zodd

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
      admin: newAdmin,
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

    // --- CAMBIO CLAVE: Generar Refresh Token y establecer como HttpOnly cookie ---
    const refreshToken = generateRefreshToken(admin.administrador_id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // ¡CRÍTICO! No accesible desde JavaScript del navegador
      secure: process.env.NODE_ENV === "production", // Usar 'secure' en producción (HTTPS)
      sameSite: "strict", // Protección CSRF (también puedes usar 'lax')
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000, // Convertir días a milisegundos
    });
    // --- FIN CAMBIO CLAVE ---

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      accessToken,
      // Ya no enviamos el refreshToken en el body, va en la cookie
      admin: {
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
    // --- CAMBIO CLAVE: Borrar la cookie del Refresh Token ---
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    // --- FIN CAMBIO CLAVE ---

    res.status(200).json({ message: "Sesión cerrada exitosamente." });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    // --- CAMBIO CLAVE: Obtener Refresh Token de la cookie ---
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh Token no encontrado en las cookies." });
    }

    const decoded = verifyRefreshToken(oldRefreshToken); // Verificar el Refresh Token
    if (!decoded || !decoded.id) {
      // Si el Refresh Token no es válido o está expirado, limpiamos la cookie
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

    // Generar un nuevo Access Token
    const newAccessToken = generateAccessToken({ id: administradorId });

    // Opcional: Generar un nuevo Refresh Token y reestablecer la cookie
    // Esto implementa la "rotación de refresh tokens", lo cual es una buena práctica de seguridad
    const newRefreshToken = generateRefreshToken(administradorId);
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
    });
    // --- FIN CAMBIO CLAVE ---

    res.status(200).json({
      message: "Token de acceso refrescado exitosamente",
      accessToken: newAccessToken,
      // El nuevo refresh token ya no se envía en el body, va en la cookie
    });
  } catch (error) {
    console.error("Error al refrescar el token:", error.message);
    res
      .status(401)
      .json({ message: "No se pudo refrescar el token de autenticación." });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
};
