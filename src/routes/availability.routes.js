// src/routes/avaliability.routes.js
const express = require('express');
const router = express.Router();
const disponibilidadController = require('../controllers/availability.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/horarios', disponibilidadController.createHorarioDisponible);
router.get('/horarios', disponibilidadController.getAllHorariosDisponibles);

router.post('/excepciones', disponibilidadController.createExcepcionDisponibilidad);
router.get('/excepciones', disponibilidadController.getAllExcepcionesDisponibilidad);

router.get('/franjas-disponibles', disponibilidadController.getFranjasDisponibles);

module.exports = router;