// src/middlewares/auth.js
const { verifyAccessToken } = require("../utils/jwt");
const { Administrador } = require("../models");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No autorizado, no hay token." });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Token inválido o expirado." });
    }

    req.user = await Administrador.findByPk(decoded.id, {
      attributes: ["administrador_id", "email", "nombre"],
    });

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Usuario del token no encontrado." });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "No autorizado, token fallido." });
  }
};

module.exports = { protect };
