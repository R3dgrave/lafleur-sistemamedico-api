const { Paciente } = require("../models");
const {
  createPacienteSchema,
  updatePacienteSchema,
} = require("../utils/validation");

const createPaciente = async (req, res, next) => {
  try {
    const validatedData = createPacienteSchema.parse(req.body);
    const newPaciente = await Paciente.create(validatedData);
    res.status(201).json({
      message: "Paciente registrado exitosamente",
      paciente: newPaciente,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "El email o RUT ya están registrados para otro paciente.",
      });
    }
    next(error);
  }
};

const getAllPacientes = async (req, res, next) => {
  try {
    const pacientes = await Paciente.findAll({
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    });
    res.status(200).json(pacientes);
  } catch (error) {
    next(error);
  }
};

const getPacienteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }
    res.status(200).json(paciente);
  } catch (error) {
    next(error);
  }
};

const getPacienteByRut = async (req, res, next) => {
  try {
    const { rut } = req.params;

    const paciente = await Paciente.findOne({
      where: { rut: rut },
    });

    if (!paciente) {
      return res
        .status(404)
        .json({ message: "Paciente no encontrado por RUT." });
    }
    res.status(200).json(paciente);
  } catch (error) {
    next(error);
  }
};

const updatePaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updatePacienteSchema.parse(req.body);
    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }
    await paciente.update(validatedData);
    res.status(200).json({
      message: "Paciente actualizado exitosamente",
      paciente: paciente,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "El email o RUT ya están registrados para otro paciente.",
      });
    }
    next(error);
  }
};

const deletePaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Paciente.destroy({
      where: { paciente_id: id },
    });
    if (result === 0) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }
    res.status(200).json({ message: "Paciente eliminado exitosamente." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaciente,
  getAllPacientes,
  getPacienteById,
  getPacienteByRut,
  updatePaciente,
  deletePaciente,
};
