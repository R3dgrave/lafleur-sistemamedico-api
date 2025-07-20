// src/routes/index.js (Centraliza las rutas)
const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const patientRoutes = require('./patient.routes');
const emergencyContactRoutes = require('./emergencyContact.routes');

/*
if (process.env.NODE_ENV !== "test") {
router.use("/autenticacion", authRoutes);
}
*/
router.use("/autenticacion", authRoutes);
router.use('/pacientes', patientRoutes);
router.use('/contactos-emergencia', emergencyContactRoutes);

module.exports = router;
