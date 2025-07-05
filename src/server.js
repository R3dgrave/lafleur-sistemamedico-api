const app = require("./app");
const { connectDB } = require("./config/sequelize");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Accede a http://localhost:${PORT}/api`);
  });
});
