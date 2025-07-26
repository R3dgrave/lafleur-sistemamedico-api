// src/routes/attention-type.routes.js
const express = require('express');
const router = express.Router();
const tipoAtencionController = require('../controllers/attention-type.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, tipoAtencionController.getAllTiposAtencion);
router.post('/', protect, tipoAtencionController.createTipoAtencion);

module.exports = router;