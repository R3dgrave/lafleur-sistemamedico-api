const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth");

router.post("/registro", authController.registerAdmin);
router.post("/inicio-sesion", authController.loginAdmin);
router.post("/cerrar-sesion", authController.logoutAdmin); // Logout requiere autenticación para saber quién cierra sesión
router.post("/refrescar", authController.refreshAccessToken);

module.exports = router;
