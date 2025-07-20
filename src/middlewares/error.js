const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;

  let message = err.message || "Error interno del servidor";

  if (err.name === "ZodError" && err.errors) {
    statusCode = 400;
    message =
      "Error de validación: " + err.errors.map((e) => e.message).join(", ");
  } else if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = `El recurso ya existe: ${err.errors
      .map((e) => e.message)
      .join(", ")}`;
  }
  console.error("--- ERROR EN EL SERVIDOR ---");
  console.error(`Status: ${statusCode}`);
  console.error(`Mensaje: ${message}`);

  if (process.env.NODE_ENV !== "production") {
    console.error("Stack Trace:", err.stack);
  }
  console.error("----------------------------");

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
