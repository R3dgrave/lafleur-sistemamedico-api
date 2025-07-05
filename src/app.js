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
    origin: process.env.FRONTEND_URL,
    credentials: true,
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
