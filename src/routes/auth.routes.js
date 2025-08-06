// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/registro", authController.registerAdmin);
router.post("/inicio-sesion", authController.loginAdmin);
router.post("/cerrar-sesion", authController.logoutAdmin);
router.post("/refrescar", authController.refreshAccessToken);
router.get("/perfil", protect, authController.getAuthenticatedUser);
router.put("/editar-perfil", protect, authController.upload.single('profile_picture'), authController.updateAdminProfile);
router.put("/actualizar-contrasena", protect, authController.updateAdminPassword);
router.put("/actualizar-preferencias-notificacion", protect, authController.updateAdminNotificationPreferences);
router.get("/administradores", protect, authController.getAllAdministrator);
router.post("/olvide-contrasena", authController.forgotPassword);
router.post("/restablecer-contrasena/:token", authController.resetPassword);

module.exports = router;
