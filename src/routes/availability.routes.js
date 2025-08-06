// src/routes/avaliability.routes.js
const express = require('express');
const router = express.Router();
const disponibilidadController = require('../controllers/availability.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/horarios', protect, disponibilidadController.createHorarioDisponible);
router.get('/horarios', protect, disponibilidadController.getAllHorariosDisponibles);
router.put('/horarios/:id', protect, disponibilidadController.updateHorariosDisponible);
router.delete('/horarios/:id', protect, disponibilidadController.deleteHorarioDisponible);

router.post('/excepciones', protect, disponibilidadController.createExcepcionDisponibilidad);
router.get('/excepciones', protect, disponibilidadController.getAllExcepcionesDisponibilidad);
router.put('/excepciones/:id', protect, disponibilidadController.updateExcepcionDisponibilidad);
router.delete('/excepciones/:id', protect, disponibilidadController.deleteExcepcionDisponibilidad);

router.get('/franjas-disponibles', protect, disponibilidadController.getFranjasDisponibles);

module.exports = router;