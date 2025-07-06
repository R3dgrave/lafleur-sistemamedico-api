const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const apiRoutes = require("./routes/index");
const { apiLimiter, loginLimiter } = require("./middlewares/rateLimit");
const errorHandler = require("./middlewares/error");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Métodos HTTP permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos (importante para Authorization)
    credentials: true, // Esto es CRUCIAL para permitir el envío de cookies (como tu refreshToken HttpOnly)
    optionsSuccessStatus: 200, // Algunas configuraciones antiguas esperaban 200 para OPTIONS, aunque 204 es más común
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(apiLimiter);
app.use("/api", apiRoutes);
app.use(errorHandler);

module.exports = app;
