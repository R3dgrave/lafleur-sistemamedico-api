//src/routes/appointment.routes.js
const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/", protect, appointmentController.createCita);
router.get("/", protect, appointmentController.getAllCitas);
router.get("/por-paciente/:rut", protect, appointmentController.getCitasByPacienteRut);
router.put("/:id", protect, appointmentController.updateCita);
router.delete("/:id", protect, appointmentController.deleteCita);

module.exports = router;
