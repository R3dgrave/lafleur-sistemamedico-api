const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500; // Usa statusCode si está definido en el error, sino 500.

  let message = err.message || "Error interno del servidor";

  // Manejo específico para errores de Zod (validación de esquemas).
  if (err.name === "ZodError" && err.errors) {
    statusCode = 400; // Bad Request
    message =
      "Error de validación: " + err.errors.map((e) => e.message).join(", ");
  } else if (err.name === "SequelizeUniqueConstraintError") {
    // Manejo específico para errores de unicidad de Sequelize.
    statusCode = 409; // Conflict
    // Intenta construir un mensaje más específico si hay detalles en los errores de Sequelize.
    message = `El recurso ya existe: ${err.errors
      .map((e) => e.message)
      .join(", ")}`;
    // Si err.errors está vacío (como en el caso de PKEY), puedes mejorar esto
    // para usar err.parent.detail o err.parent.constraint si es necesario.
    // Por ahora, el mensaje general es suficiente si los controladores ya pre-validan.
  }
  // Añadir un manejo para errores de autenticación si no tienen un statusCode explícito
  // y el mensaje sugiere un problema de token.
  else if (
    err.message.includes("token") ||
    err.message.includes("autorizado")
  ) {
    statusCode = 401; // Unauthorized
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
