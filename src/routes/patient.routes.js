// src/routes/patient.routes.js
const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patient.controller");
const { protect } = require("../middlewares/auth");

router.post("/", protect, patientController.createPaciente);
router.get("/", protect, patientController.getAllPacientes);
router.get("/rut/:rut", patientController.getPacienteByRut);
router.get("/:id", protect, patientController.getPacienteById);
router.put("/:id", protect, patientController.updatePaciente);
router.delete("/:id", protect, patientController.deletePaciente);

module.exports = router;
