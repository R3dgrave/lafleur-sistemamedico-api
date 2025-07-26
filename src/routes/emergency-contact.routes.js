const express = require("express");
const router = express.Router();
const emergencyContactController = require("../controllers/emergency-contact.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/", protect, emergencyContactController.createContactoEmergencia);
router.get("/", protect, emergencyContactController.getAllContactosEmergencia);
router.get("/por-paciente/:rut", protect, emergencyContactController.getContactosEmergenciaByPacienteRut);
router.get("/:id", protect, emergencyContactController.getContactoEmergenciaById);
router.put("/:id", protect, emergencyContactController.updateContactoEmergencia);
router.delete("/:id", protect, emergencyContactController.deleteContactoEmergencia);

module.exports = router;
