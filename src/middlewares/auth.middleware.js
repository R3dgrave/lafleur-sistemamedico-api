// Importaciones necesarias
const { verifyAccessToken } = require("../utils/jwt");
const { Administrador } = require("../../models/index");

/**
 * Middleware de protección de rutas.
 * Verifica la validez del Access Token en el encabezado de autorización
 * y adjunta la información del usuario autenticado a `req.user`.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    const error = new Error("No autorizado, no hay token.");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.id) {
      const error = new Error("Token inválido o expirado.");
      error.statusCode = 401;
      return next(error);
    }

    req.user = await Administrador.findByPk(decoded.id, {
      attributes: [
        "administrador_id",
        "email",
        "nombre",
        "apellido",
        "role",
        "profile_picture_url",
      ],
    });

    if (!req.user) {
      const error = new Error("Usuario del token no encontrado.");
      error.statusCode = 401;
      return next(error);
    }

    next();
  } catch (error) {
    console.error("Error en el middleware de autenticación:", error.message);
    const authError = new Error("No autorizado, token fallido.");
    authError.statusCode = 401;
    next(authError);
  }
};

module.exports = { protect };
