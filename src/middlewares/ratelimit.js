const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Demasiadas peticiones desde esta IP, por favor intente de nuevo después de 15 minutos.",
  },
  handler: (req, res, next, options) => {
    console.warn(
      `Intento de abuso detectado para IP: ${req.ip} - Límite excedido.`
    );
    res.status(options.statusCode).send(options.message);
  },
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
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
  loginLimiter,
};
