const Administrador = require("./administrador.model");
const Paciente = require("./paciente.model");
const ContactoEmergencia = require('./contacto_emergencia.model');

Paciente.hasMany(ContactoEmergencia, { foreignKey: 'paciente_id', onDelete: 'CASCADE' });
ContactoEmergencia.belongsTo(Paciente, { foreignKey: 'paciente_id' });

module.exports = {
  Administrador,
  Paciente,
  ContactoEmergencia,
};
