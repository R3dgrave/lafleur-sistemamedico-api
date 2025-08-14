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

    const errors = [];
    let generalMessage = "Error de validación de unicidad.";
    const existingPatientByEmail = await Paciente.findOne({
      where: { email: validatedData.email },
    });
    if (existingPatientByEmail) {
      errors.push({
        path: ["email"],
        message: "Este email ya está registrado.",
      });
    }

    const existingPatientByRut = await Paciente.findOne({
      where: { rut: validatedData.rut },
    });
    if (existingPatientByRut) {
      errors.push({ path: ["rut"], message: "Este RUT ya está registrado." });
    }

    if (errors.length > 0) {
      if (errors.length === 2) {
        generalMessage = "El email y el RUT ya están registrados.";
      } else if (errors.length === 1) {
        generalMessage = errors[0].message;
      }
      return res.status(409).json({
        message: generalMessage,
        errors: errors,
      });
    }

    const newPaciente = await Paciente.create(validatedData);
    res.status(201).json({
      message: "Paciente registrado exitosamente",
      paciente: newPaciente,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      let errors = [];
      if (error.errors && error.errors.length > 0) {
        errors = error.errors.map((err) => {
          const field =
            err.path && typeof err.path === "string"
              ? err.path
              : "unknown_field";
          let message = err.message || "Valor duplicado.";
          return { path: [field], message: message };
        });
      } else if (error.parent && error.parent.constraint) {
        const constraintName = error.parent.constraint;
        let field = "unknown_field";
        let message = error.parent.detail || "Error de unicidad desconocido.";

        if (constraintName.includes("email")) {
          field = "email";
          message = "Este email ya está registrado.";
        } else if (constraintName.includes("rut")) {
          field = "rut";
          message = "Este RUT ya está registrado.";
        } else if (constraintName.includes("pkey")) {
          field = "paciente_id";
          message =
            "Ya existe un paciente con este ID (problema de clave primaria).";
        }
        errors.push({ path: [field], message: message });
      }

      return res.status(409).json({
        message: "Error de validación de unicidad.",
        errors: errors,
      });
    } else if (error.issues) {
      const zodErrors = error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      }));
      return res.status(400).json({
        message: "Errores de validación de datos.",
        errors: zodErrors,
      });
    }
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
