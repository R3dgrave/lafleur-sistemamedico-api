// src/routes/clinicalHistory.routes.js
const express = require('express');
const router = express.Router();
const clinicalHistoryController = require('../controllers/clinical-history.controller');
const { protect } = require('../middlewares/auth.middleware');

// RUTAS HISTORIA_CLINICA
router.post('/', protect, clinicalHistoryController.createHistoriaClinica);
router.get('/paciente/:pacienteId', protect, clinicalHistoryController.getHistoriaClinicaByPacienteId);
router.get('/rut/:rut', protect, clinicalHistoryController.getHistoriaClinicaByPacienteRut);

// RUTAS ANAMNESIS
router.post('/:historiaClinicaId/anamnesis', protect, clinicalHistoryController.createAnamnesis);
router.get('/:historiaClinicaId/anamnesis', protect, clinicalHistoryController.getAnamnesisByHistoriaClinicaId);
router.put('/anamnesis/:anamnesisId', protect, clinicalHistoryController.updateAnamnesis);
router.delete('/anamnesis/:anamnesisId', protect, clinicalHistoryController.deleteAnamnesis);

// RUTAS EXPLORACION_FISICA
router.post('/:historiaClinicaId/exploracion-fisica', protect, clinicalHistoryController.createExploracionFisica);
router.get('/:historiaClinicaId/exploracion-fisica', protect, clinicalHistoryController.getExploracionFisicaByHistoriaClinicaId);
router.put('/exploracion-fisica/:exploracionId', protect, clinicalHistoryController.updateExploracionFisica);
router.delete('/exploracion-fisica/:exploracionId', protect, clinicalHistoryController.deleteExploracionFisica);

// RUTAS PARA DIAGNOSTICO
router.post('/:historiaClinicaId/diagnosticos', protect, clinicalHistoryController.createDiagnostico);
router.get('/:historiaClinicaId/diagnosticos', protect, clinicalHistoryController.getDiagnosticosByHistoriaClinicaId);
router.put('/diagnosticos/:diagnosticoId', protect, clinicalHistoryController.updateDiagnostico);
router.delete('/diagnosticos/:diagnosticoId', protect, clinicalHistoryController.deleteDiagnostico);

// RUTAS PARA PLAN TRATAMIENTO
router.post('/:historiaClinicaId/plan-tratamiento', protect, clinicalHistoryController.createPlanTratamiento);
router.get('/:historiaClinicaId/plan-tratamiento', protect, clinicalHistoryController.getPlanesTratamientoByHistoriaClinica);
router.get('/plan-tratamiento/:planId', protect, clinicalHistoryController.getPlanTratamientoById);
router.put('/plan-tratamiento/:planId', protect, clinicalHistoryController.updatePlanTratamiento);
router.delete('/plan-tratamiento/:planId', protect, clinicalHistoryController.deletePlanTratamiento);

// RUTAS PARA PRUEBAS INICIALES
router.post('/pruebas-iniciales', protect, clinicalHistoryController.createPruebasIniciales);
router.get('/pruebas-iniciales/paciente/:pacienteId', protect, clinicalHistoryController.getPruebasInicialesByPacienteId);
router.put('/pruebas-iniciales/:pruebaId', protect, clinicalHistoryController.updatePruebasIniciales);
router.delete('/pruebas-iniciales/:pruebaId', protect, clinicalHistoryController.deletePruebasIniciales);

module.exports = router;