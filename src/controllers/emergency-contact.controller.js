// src/controllers/emergencyContactController.js
const { ContactoEmergencia, Paciente } = require("../../models/index");
const {
  createContactoEmergenciaSchema,
  updateContactoEmergenciaSchema,
} = require("../utils/validation");
const { NotFoundError, ConflictError } = require("../utils/customErrors");

/**
 * Función auxiliar para obtener el ID de un paciente por su RUT.
 * Lanza un NotFoundError si el paciente no existe.
 */
const _getPacienteIdByRut = async (rut) => {
  const paciente = await Paciente.findOne({ where: { rut } });
  if (!paciente) {
    throw new NotFoundError("Paciente con el RUT especificado no encontrado.");
  }
  return paciente.paciente_id;
};

const createContactoEmergencia = async (req, res, next) => {
  try {
    const validatedData = createContactoEmergenciaSchema.parse(req.body);
    const { rut_paciente, ...contactData } = validatedData;
    const paciente_id = await _getPacienteIdByRut(rut_paciente);

    const existingContact = await ContactoEmergencia.findOne({
      where: {
        paciente_id: paciente_id,
        nombre_contacto: contactData.nombre_contacto,
        telefono_contacto: contactData.telefono_contacto,
      },
    });

    if (existingContact) {
      throw new ConflictError(
        "Ya existe un contacto de emergencia con este nombre y teléfono para este paciente."
      );
    }

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
    const whereClause = paciente_id ? { paciente_id } : {};

    const contactos = await ContactoEmergencia.findAll({
      where: whereClause,
      include: [{ model: Paciente, attributes: ["nombre", "apellido"] }],
      order: [["nombre_contacto", "ASC"]],
    });
    res.status(200).json(contactos);
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
      throw new NotFoundError("Contacto de emergencia no encontrado.");
    }

    let newPacienteId = contacto.paciente_id;
    if (rut_paciente) {
      newPacienteId = await _getPacienteIdByRut(rut_paciente);
    }

    const updatedContacto = await contacto.update({
      paciente_id: newPacienteId,
      ...contactData,
    });

    console.log(updatedContacto);
    res.status(200).json({
      message: "Contacto de emergencia actualizado exitosamente",
      contacto: updatedContacto,
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
      throw new NotFoundError("Contacto de emergencia no encontrado.");
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
  updateContactoEmergencia,
  deleteContactoEmergencia,
};
