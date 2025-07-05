const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const apiRoutes = require("./routes/index");
const { apiLimiter, loginLimiter } = require("./middlewares/rateLimit");
const errorHandler = require("./middlewares/error");
const cookieParser = require("cookie-parser");

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Reemplaza con la URL de tu frontend
    credentials: true, // Muy importante para permitir el envío de cookies
  })
);
app.use(helmet());
app.use(morgan("dev")); // Logger de peticiones HTTP
app.use(express.json()); // Para parsear bodies JSON
app.use(express.urlencoded({ extended: true })); // Para parsear URL-encoded bodies
app.use(cookieParser()); // Usa el middleware de cookie-parser

app.use(apiLimiter);
app.use("/api", apiRoutes);
app.use(errorHandler);

module.exports = app;
