// Importaciones necesarias
const { verifyAccessToken } = require("../utils/jwt"); // Utilidad para verificar el Access Token
const { Administrador } = require("../../models/index"); // Modelo del Administrador

/**
 * Middleware de protección de rutas.
 * Verifica la validez del Access Token en el encabezado de autorización
 * y adjunta la información del usuario autenticado a `req.user`.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware o ruta.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Verificar si el token está presente en el encabezado de autorización.
  // Se espera un formato "Bearer TOKEN".
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; // Extrae el token de la cadena.
  }

  // 2. Si no se encontró ningún token, el usuario no está autorizado.
  if (!token) {
    // Pasa un error al siguiente middleware de errores.
    // Se puede adjuntar un `statusCode` o `status` al error para que el errorHandler lo use.
    const error = new Error("No autorizado, no hay token.");
    error.statusCode = 401; // Define el código de estado para el error.
    return next(error);
  }

  try {
    // 3. Verificar y decodificar el Access Token.
    const decoded = verifyAccessToken(token);

    // Si el token es inválido (ej. expirado, mal formado) o no contiene un ID.
    if (!decoded || !decoded.id) {
      const error = new Error("Token inválido o expirado.");
      error.statusCode = 401;
      return next(error);
    }

    // 4. Buscar al administrador en la base de datos usando el ID del token decodificado.
    // Se seleccionan solo los atributos necesarios para evitar exponer datos sensibles.
    req.user = await Administrador.findByPk(decoded.id, {
      attributes: ["administrador_id", "email", "nombre", "apellido"], // Incluir apellido si es útil.
    });

    // 5. Si el usuario no se encuentra en la base de datos (ej. fue eliminado).
    if (!req.user) {
      const error = new Error("Usuario del token no encontrado.");
      error.statusCode = 401;
      return next(error);
    }

    // 6. Si todo es válido, pasa el control al siguiente middleware o a la ruta.
    next();
  } catch (error) {
    // 7. Captura cualquier otro error durante el proceso de verificación del token.
    // Esto incluye errores de JWT (ej. JsonWebTokenError, TokenExpiredError).
    console.error("Error en el middleware de autenticación:", error.message);
    const authError = new Error("No autorizado, token fallido.");
    authError.statusCode = 401; // Asegura que se envíe un 401.
    next(authError); // Pasa el error al middleware centralizado.
  }
};

module.exports = { protect };
