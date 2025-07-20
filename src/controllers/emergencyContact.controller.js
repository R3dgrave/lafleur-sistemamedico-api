const { ContactoEmergencia, Paciente } = require("../models");
const {
  createContactoEmergenciaSchema,
  updateContactoEmergenciaSchema,
} = require("../utils/validation");

const createContactoEmergencia = async (req, res, next) => {
  try {
    const validatedData = createContactoEmergenciaSchema.parse(req.body);
    const { rut_paciente, ...contactData } = validatedData;

    const paciente_id = await getPacienteIdByRut(rut_paciente, next);

    const newContacto = await ContactoEmergencia.create({
      paciente_id,
      ...contactData,
    });

    res.status(201).json({
      message: "Contacto de emergencia registrado exitosamente",
      contacto: newContacto,
    });
  } catch (error) {
    next(error);
  }
};

const getAllContactosEmergencia = async (req, res, next) => {
  try {
    const { paciente_id } = req.query;
    const whereClause = {};
    if (paciente_id) {
      whereClause.paciente_id = paciente_id;
    }
    const contactos = await ContactoEmergencia.findAll({
      where: whereClause,
      include: [{ model: Paciente, attributes: ["nombre", "apellido"] }],
    });
    res.status(200).json(contactos);
  } catch (error) {
    next(error);
  }
};

const getPacienteIdByRut = async (rut, next) => {
  const paciente = await Paciente.findOne({ where: { rut } });
  if (!paciente) {
    const error = new Error("Paciente con el RUT especificado no encontrado.");
    error.statusCode = 404;
    throw error;
  }
  return paciente.paciente_id;
};

const getContactosEmergenciaByPacienteRut = async (req, res, next) => {
  try {
    const { rut } = req.params;
    const paciente_id = await getPacienteIdByRut(rut, next);
    const contactos = await ContactoEmergencia.findAll({
      where: { paciente_id },
      include: [
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "rut"],
        },
      ],
      order: [["nombre_contacto", "ASC"]],
    });
    if (contactos.length === 0) {
      return res.status(404).json({
        message:
          "No se encontraron contactos de emergencia para el paciente con el RUT proporcionado.",
      });
    }
    res.status(200).json(contactos);
  } catch (error) {
    next(error);
  }
};

const getContactoEmergenciaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contacto = await ContactoEmergencia.findByPk(id, {
      include: [{ model: Paciente, attributes: ["nombre", "apellido"] }],
    });
    if (!contacto) {
      return res
        .status(404)
        .json({ message: "Contacto de emergencia no encontrado." });
    }
    res.status(200).json(contacto);
  } catch (error) {
    next(error);
  }
};

const updateContactoEmergencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateContactoEmergenciaSchema.parse(req.body);
    const { rut_paciente, ...contactData } = validatedData;

    const contacto = await ContactoEmergencia.findByPk(id);
    if (!contacto) {
      return res
        .status(404)
        .json({ message: "Contacto de emergencia no encontrado." });
    }

    let newPacienteId = contacto.paciente_id;
    if (rut_paciente) {
      newPacienteId = await getPacienteIdByRut(rut_paciente, next);
    }

    await contacto.update({
      paciente_id: newPacienteId,
      ...contactData,
    });

    res.status(200).json({
      message: "Contacto de emergencia actualizado exitosamente",
      contacto: contacto,
    });
  } catch (error) {
    next(error);
  }
};

const deleteContactoEmergencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await ContactoEmergencia.destroy({
      where: { contacto_emergencia_id: id },
    });
    if (result === 0) {
      return res
        .status(404)
        .json({ message: "Contacto de emergencia no encontrado." });
    }
    res
      .status(200)
      .json({ message: "Contacto de emergencia eliminado exitosamente." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContactoEmergencia,
  getAllContactosEmergencia,
  getPacienteIdByRut,
  getContactosEmergenciaByPacienteRut,
  getContactoEmergenciaById,
  updateContactoEmergencia,
  deleteContactoEmergencia,
};
