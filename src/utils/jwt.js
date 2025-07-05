const jwt = require("jsonwebtoken");
require("dotenv").config();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRATION = process.env.JWT_EXPIRES_IN || "1h";
const REFRESH_TOKEN_EXPIRATION_DAYS_INT = parseInt(
  process.env.REFRESH_TOKEN_EXPIRATION_DAYS || "7",
  10
);
const REFRESH_TOKEN_EXPIRATION_JWT_FORMAT = `${REFRESH_TOKEN_EXPIRATION_DAYS_INT}d`; // Para jwt.sign

// Función para generar un Access Token
const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });
};

// Función para generar un Refresh Token (ya no se guarda en la DB)
const generateRefreshToken = (administrador_id) => {
  // El payload solo necesita el ID del administrador
  return jwt.sign({ id: administrador_id }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION_JWT_FORMAT,
  });
};

// Función para verificar un Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null; // Token inválido o expirado
  }
};

// Función para verificar un Refresh Token (ya no necesita buscar en DB)
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null; // Refresh Token inválido o expirado
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
