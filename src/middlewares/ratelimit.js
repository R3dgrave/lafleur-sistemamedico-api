const rateLimit = require("express-rate-limit");

// Definición del limitador de tasa para la API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos (tiempo en el que se aplica el límite)
  max: 100, // Límite de 100 peticiones por cada IP dentro de los 15 minutos
  standardHeaders: true, // Retorna los encabezados `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
  legacyHeaders: false, // Deshabilita los encabezados `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  message: {
    message:
      "Demasiadas peticiones desde esta IP, por favor intente de nuevo después de 15 minutos.",
  },
  // Handler para cuando se excede el límite
  handler: (req, res, next, options) => {
    // Puedes loguear el intento de ataque o notificar aquí
    console.warn(
      `Intento de abuso detectado para IP: ${req.ip} - Límite excedido.`
    );
    res.status(options.statusCode).send(options.message);
  },
});

// Puedes definir limitadores específicos para rutas más sensibles, por ejemplo, login:
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // Solo 5 intentos de inicio de sesión por IP en 5 minutos
  message: {
    message:
      "Demasiados intentos de inicio de sesión desde esta IP, por favor intente de nuevo en 5 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`Intento de fuerza bruta en login para IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});

module.exports = {
  apiLimiter,
  loginLimiter, // Exporta ambos limitadores
};
