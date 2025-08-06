// src/routes/index.js (Centraliza las rutas)
const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const patientRoutes = require("./patient.routes");
const emergencyContactRoutes = require("./emergency-contact.routes");
const appointmentRoutes = require("./appointment.routes");
const tipoAtencionRoutes = require("./attention-type.routes");
const disponibilidadRoutes = require("./availability.routes");
const clinicalHistoryRoutes = require("./clinical-history.routes");

/*
if (process.env.NODE_ENV !== "test") {
router.use("/autenticacion", authRoutes);
}
*/
router.use("/autenticacion", authRoutes);
router.use("/pacientes", patientRoutes);
router.use("/contactos-emergencia", emergencyContactRoutes);
router.use("/citas", appointmentRoutes);
router.use("/tipos-atencion", tipoAtencionRoutes);
router.use("/disponibilidad", disponibilidadRoutes);
router.use('/historia-clinica', clinicalHistoryRoutes); 

module.exports = router;
