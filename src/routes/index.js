// src/routes/index.js (Centraliza las rutas)
const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");

router.use("/autenticacion", authRoutes);

module.exports = router;
