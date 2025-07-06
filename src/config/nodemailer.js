const nodemailer = require("nodemailer");

// Configuración de tu servicio de correo
// **IMPORTANTE**: Para Gmail, necesitarás generar una "Contraseña de aplicación" (App Password)
// en tu cuenta de Google, ya que las contraseñas normales no funcionan para aplicaciones externas.
// https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Por ejemplo: 'smtp.gmail.com'
  port: process.env.EMAIL_PORT, // Por ejemplo: 587 o 465
  secure: process.env.EMAIL_SECURE === "true", // true para 465, false para otros puertos como 587
  auth: {
    user: process.env.EMAIL_USER, // Tu dirección de correo electrónico
    pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación o contraseña de SMTP
  },
});

module.exports = transporter;
