// src/routes/index.js (Centraliza las rutas)
const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes"); // Asume que tienes rutas para login/registro de administradores
// ... importa otras rutas

router.use("/autenticacion", authRoutes);

module.exports = router;
