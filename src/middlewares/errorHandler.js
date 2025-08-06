// /middlewares/errorHandler.js
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} = require("../utils/customErrors");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor";
  let errors = [];

  // Manejo de errores personalizados
  if (err instanceof NotFoundError) {
    statusCode = 404;
  } else if (err instanceof BadRequestError) {
    statusCode = 400;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
  }

  // Manejo de errores de Zod
  else if (err.name === "ZodError" && err.errors) {
    statusCode = 400;
    message = "Error de validación de datos.";
    errors = err.errors.map((e) => ({ path: e.path, message: e.message }));
  }

  // Manejo de errores de Sequelize de unicidad
  else if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = "El recurso ya existe.";
    errors = err.errors.map((e) => {
      let friendlyMessage = e.message;
      if (e.path === "email") {
        friendlyMessage = "Este email ya está registrado.";
      } else if (e.path === "rut") {
        friendlyMessage = "Este RUT ya está registrado.";
      }
      return { path: [e.path], message: friendlyMessage };
    });
  }

  // Registrar errores en consola para depuración
  console.error("--- ERROR EN EL SERVIDOR ---");
  console.error(`Status: ${statusCode}`);
  console.error(`Mensaje: ${message}`);
  if (errors.length > 0) {
    console.error("Detalles del error:", errors);
  }
  if (process.env.NODE_ENV !== "production") {
    console.error("Stack Trace:", err.stack);
  }
  console.error("----------------------------");

  res.status(statusCode).json({
    message: message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;
