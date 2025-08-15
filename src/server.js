const app = require("./app");
const { connectDB } = require("./config/sequelize");
require("dotenv").config();

// Determina el entorno y el puerto a usar
const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(port, () => {
    let baseUrl = '';

    if (env === 'production') {
      baseUrl = process.env.BACKEND_URL_PRODUCTION;
    } else {
      baseUrl = `http://localhost:${port}`;
    }
    
    console.log(`Entorno de ejecución: ${env}`);
    console.log(`Servidor corriendo en el puerto ${port}`);
    console.log(`Accede a ${baseUrl}/api`);
  });
});