/**
 * Middleware para el manejo centralizado de errores.
 * Captura errores que son pasados a `next(error)` en cualquier parte de la aplicación.
 *
 * @param {Error} err - El objeto de error.
 * @param {import('express').Request} req - El objeto de solicitud de Express.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - La función next de Express.
 */
const errorHandler = (err, req, res, next) => {
  // Determina el código de estado HTTP. Si el error tiene un `statusCode`, úsalo; de lo contrario, 500 (Internal Server Error).
  const statusCode = err.statusCode || 500;

  // Determina el mensaje de error a enviar.
  // En desarrollo, puedes enviar el mensaje de error completo y el stack trace.
  // En producción, es mejor enviar un mensaje genérico para evitar exponer información sensible.
  let message = err.message || "Error interno del servidor";

  // Manejo específico para errores de validación (ej. de Zod, si no los capturas antes)
  // Aunque Zod puede ser manejado antes, si un error de validación llega aquí, puedes formatearlo.
  if (err.name === "ZodError" && err.errors) {
    statusCode = 400; // Bad Request
    message =
      "Error de validación: " + err.errors.map((e) => e.message).join(", ");
  }
  // Manejo específico para errores de Sequelize (ej. UniqueConstraintError si no se captura en el controlador)
  else if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409; // Conflict
    message = `El recurso ya existe: ${err.errors
      .map((e) => e.message)
      .join(", ")}`;
  }
  // Añade aquí otros tipos de errores que quieras manejar de forma específica

  // Loguea el error para depuración en el servidor (no para el cliente)
  // En producción, considera usar un logger más robusto (Winston, Pino)
  console.error("--- ERROR EN EL SERVIDOR ---");
  console.error(`Status: ${statusCode}`);
  console.error(`Mensaje: ${message}`);
  // Si estás en desarrollo, loguea el stack trace completo
  if (process.env.NODE_ENV !== "production") {
    console.error("Stack Trace:", err.stack);
  }
  console.error("----------------------------");

  // Envía la respuesta de error al cliente
  res.status(statusCode).json({
    message: message,
    // En desarrollo, puedes incluir el stack trace para el cliente si es útil para el debugging.
    // En producción, REMUEVE esta línea.
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
