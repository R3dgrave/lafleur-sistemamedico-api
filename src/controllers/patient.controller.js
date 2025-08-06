const { Paciente } = require("../../models/index");
const {
  createPacienteSchema,
  updatePacienteSchema,
} = require("../utils/validation");
const { Op } = require("sequelize");
const { NotFoundError, BadRequestError } = require("../utils/customErrors");

const createPaciente = async (req, res, next) => {
  try {
    const validatedData = createPacienteSchema.parse(req.body);
    const newPaciente = await Paciente.create(validatedData);
    res.status(201).json({
      message: "Paciente registrado exitosamente",
      paciente: newPaciente,
    });
  } catch (error) {
    next(error);
  }
};

const getAllPacientes = async (req, res, next) => {
  try {
    const pacientes = await Paciente.findAll({
      attributes: [
        "paciente_id",
        "nombre",
        "apellido",
        "rut",
        "email",
        "fecha_nacimiento",
        "genero",
        "telefono",
        "direccion",
        "identidad_genero",
        "sexo_registral",
      ],
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
      throw new NotFoundError("Paciente no encontrado.");
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
      throw new NotFoundError("Paciente no encontrado por RUT.");
    }
    res.status(200).json(paciente);
  } catch (error) {
    next(error);
  }
};

const searchPacientes = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 3) {
      throw new BadRequestError(
        "Se requiere al menos 3 caracteres para la búsqueda."
      );
    }
    const searchWords = query.trim().split(/\s+/).filter(Boolean);
    const searchConditions = searchWords.map((word) => ({
      [Op.or]: [
        { nombre: { [Op.iLike]: `%${word}%` } },
        { apellido: { [Op.iLike]: `%${word}%` } },
        { rut: { [Op.iLike]: `%${word}%` } },
      ],
    }));
    const pacientes = await Paciente.findAll({
      where: {
        [Op.and]: searchConditions,
      },
      attributes: [
        "paciente_id",
        "nombre",
        "apellido",
        "rut",
        "email",
        "fecha_nacimiento",
        "genero",
      ],
      limit: 10,
    });
    res.status(200).json(pacientes);
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
      throw new NotFoundError("Paciente no encontrado.");
    }
    await paciente.update(validatedData);
    res.status(200).json({
      message: "Paciente actualizado exitosamente",
      paciente: paciente,
    });
  } catch (error) {
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
      throw new NotFoundError("Paciente no encontrado.");
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
  searchPacientes,
};
