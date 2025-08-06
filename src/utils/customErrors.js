// src/utils/customErrors.js
class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de validación, por ejemplo, de Zod o de datos de entrada.
 * @class
 * @extends {BaseError}
 */
class ValidationError extends CustomError {
  constructor(message, errors) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Error para recursos no encontrados (código de estado 404).
 * Ejemplo: Paciente no encontrado por ID.
 */
class NotFoundError extends CustomError {
  constructor(message = "Recurso no encontrado.") {
    super(message, 404);
  }
}

/**
 * Error para datos de entrada inválidos (código de estado 400).
 * Se usara para validaciones que no son de Zod (ej. búsqueda con menos de 3 caracteres).
 */
class BadRequestError extends CustomError {
  constructor(message = "La solicitud es inválida.") {
    super(message, 400);
  }
}

/**
 * Error para conflictos de recursos (código de estado 409).
 * Se usara para casos de unicidad en la base de datos (ej. email o RUT duplicados).
 */
class ConflictError extends CustomError {
  constructor(message = "El recurso ya existe.") {
    super(message, 409);
  }
}

/**
 * Error para fallos de autenticación (código de estado 401).
 * Por ejemplo: Token inválido o no proporcionado.
 */
class UnauthorizedError extends CustomError {
  constructor(message = "No estás autorizado para realizar esta acción.") {
    super(message, 401);
  }
}

module.exports = {
  NotFoundError,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  CustomError,
};
