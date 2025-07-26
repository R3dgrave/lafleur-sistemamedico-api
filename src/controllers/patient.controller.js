const { Paciente } = require("../../models/index");
const {
  createPacienteSchema,
  updatePacienteSchema,
} = require("../utils/validation");
const { Op } = require("sequelize");

/**
 * Controlador para crear un nuevo paciente.
 * Realiza validaciones de unicidad para email y RUT antes de intentar la creación
 * para poder devolver múltiples errores de duplicidad al frontend.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const createPaciente = async (req, res, next) => {
  try {
    // 1. Validar los datos de entrada usando el esquema Zod.
    // Si la validación falla, Zod lanzará un error que será capturado en el bloque catch.
    const validatedData = createPacienteSchema.parse(req.body);

    const errors = []; // Array para recolectar errores de unicidad específicos.
    let generalMessage = "Error de validación de unicidad."; // Mensaje general para el toast del frontend.

    // 2. Verificación de unicidad para EMAIL.
    // Busca si ya existe un paciente con el email proporcionado.
    const existingPatientByEmail = await Paciente.findOne({
      where: { email: validatedData.email },
    });
    if (existingPatientByEmail) {
      // Si se encuentra un duplicado, añade un error específico al array.
      errors.push({
        path: ["email"],
        message: "Este email ya está registrado.",
      });
    }

    // 3. Verificación de unicidad para RUT.
    // Busca si ya existe un paciente con el RUT proporcionado.
    const existingPatientByRut = await Paciente.findOne({
      where: { rut: validatedData.rut },
    });
    if (existingPatientByRut) {
      // Si se encuentra un duplicado, añade un error específico al array.
      errors.push({ path: ["rut"], message: "Este RUT ya está registrado." });
    }

    // 4. Si se encontraron uno o más errores de duplicidad, envía la respuesta 409.
    if (errors.length > 0) {
      if (errors.length === 2) {
        // Si ambos (email y RUT) son duplicados.
        generalMessage = "El email y el RUT ya están registrados.";
      } else if (errors.length === 1) {
        // Si solo hay un error, el mensaje general es el del error específico.
        generalMessage = errors[0].message;
      }
      return res.status(409).json({
        message: generalMessage, // Mensaje para el toast.
        errors: errors, // Array de errores estructurados para marcar los campos en el frontend.
      });
    }

    // 5. Si no hay errores de unicidad, procede con la creación del paciente en la base de datos.
    const newPaciente = await Paciente.create(validatedData);
    res.status(201).json({
      message: "Paciente registrado exitosamente",
      paciente: newPaciente,
    });
  } catch (error) {
    // 6. Manejo de errores.
    // Este bloque captura errores que no fueron manejados por las verificaciones previas (ej. Zod, otros errores de DB).

    // Si el error es una violación de unicidad de Sequelize (ej. para campos no pre-verificados, o pkey).
    if (error.name === "SequelizeUniqueConstraintError") {
      // Se intenta extraer información del error de Sequelize para estructurarla.
      let errors = [];
      if (error.errors && error.errors.length > 0) {
        // Si Sequelize pobló el array 'errors' (comportamiento esperado para UNIQUE constraints directas).
        errors = error.errors.map((err) => {
          const field =
            err.path && typeof err.path === "string"
              ? err.path
              : "unknown_field";
          let message = err.message || "Valor duplicado.";
          return { path: [field], message: message };
        });
      } else if (error.parent && error.parent.constraint) {
        // Si 'error.errors' está vacío, pero el error es una violación de unicidad de la base de datos
        // (ej. de una clave primaria o restricción UNIQUE con un nombre específico).
        const constraintName = error.parent.constraint;
        let field = "unknown_field";
        let message = error.parent.detail || "Error de unicidad desconocido.";

        // Intenta inferir el campo desde el nombre de la restricción de la base de datos.
        if (constraintName.includes("email")) {
          field = "email";
          message = "Este email ya está registrado.";
        } else if (constraintName.includes("rut")) {
          field = "rut";
          message = "Este RUT ya está registrado.";
        } else if (constraintName.includes("pkey")) {
          field = "paciente_id"; // Esto es un error de clave primaria, no directamente un campo del formulario.
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
      // Si el error es de Zod (ej. datos mal formateados, campos faltantes).
      const zodErrors = error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      }));
      return res.status(400).json({
        message: "Errores de validación de datos.",
        errors: zodErrors,
      });
    }
    // Para cualquier otro tipo de error no manejado específicamente, se pasa al siguiente middleware de errores.
    next(error);
  }
};

/**
 * Controlador para obtener todos los pacientes.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAllPacientes = async (req, res, next) => {
  try {
    // Busca todos los pacientes en la base de datos, ordenados por apellido y luego por nombre.
    const pacientes = await Paciente.findAll({
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    });
    res.status(200).json(pacientes);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

/**
 * Controlador para obtener un paciente por su ID.
 * @param {Object} req - Objeto de solicitud de Express (req.params.id contiene el ID del paciente).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getPacienteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Busca un paciente por su clave primaria (ID).
    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      // Si el paciente no se encuentra, devuelve un error 404.
      return res.status(404).json({ message: "Paciente no encontrado." });
    }
    res.status(200).json(paciente);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

/**
 * Controlador para obtener un paciente por su RUT.
 * @param {Object} req - Objeto de solicitud de Express (req.params.rut contiene el RUT del paciente).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getPacienteByRut = async (req, res, next) => {
  try {
    const { rut } = req.params;

    // Busca un paciente por su RUT.
    const paciente = await Paciente.findOne({
      where: { rut: rut },
    });

    if (!paciente) {
      // Si el paciente no se encuentra, devuelve un error 404.
      return res
        .status(404)
        .json({ message: "Paciente no encontrado por RUT." });
    }
    res.status(200).json(paciente);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

/**
 * Controlador para buscar pacientes por nombre, apellido o RUT.
 * @param {Object} req - Objeto de solicitud de Express (req.query.query contiene el término de búsqueda).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const searchPacientes = async (req, res, next) => {
  try {
    const { query } = req.query;
    // Valida que el término de búsqueda exista y tenga al menos 3 caracteres.
    if (!query || query.length <= 3) {
      return res
        .status(400)
        .json({
          message: "Se requiere al menos 3 caracteres para la búsqueda.",
        });
    }

    // Busca pacientes donde el término de búsqueda coincida (insensible a mayúsculas/minúsculas)
    // con parte del nombre, apellido o RUT. Limita los resultados a 10.
    const pacientes = await Paciente.findAll({
      where: {
        [Op.or]: [
          // Usa OR para buscar en múltiples campos.
          { nombre: { [Op.iLike]: `%${query}%` } }, // `iLike` para búsqueda insensible a mayúsculas/minúsculas en PostgreSQL.
          { apellido: { [Op.iLike]: `%${query}%` } },
          { rut: { [Op.iLike]: `%${query}%` } },
        ],
      },
      attributes: ["paciente_id", "nombre", "apellido", "rut", "email"], // Selecciona solo los atributos necesarios.
      limit: 10, // Limita el número de resultados para un mejor rendimiento.
    });
    res.status(200).json(pacientes);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

/**
 * Controlador para actualizar un paciente existente.
 * Realiza verificaciones de unicidad para email y RUT, excluyendo al paciente que se está actualizando.
 * @param {Object} req - Objeto de solicitud de Express (req.params.id contiene el ID del paciente).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const updatePaciente = async (req, res, next) => {
  try {
    const { id } = req.params; // ID del paciente a actualizar.
    // 1. Validar los datos de entrada usando el esquema Zod para actualización.
    const validatedData = updatePacienteSchema.parse(req.body);

    const errors = []; // Array para recolectar errores de unicidad específicos.
    let generalMessage = "Error de validación de unicidad."; // Mensaje general para el toast del frontend.

    // 2. Verificación de unicidad para EMAIL (excluyendo el paciente actual).
    // Solo verifica si el email está presente en los datos validados.
    if (validatedData.email) {
      const existingPatientByEmail = await Paciente.findOne({
        where: {
          email: validatedData.email,
          paciente_id: { [Op.ne]: id }, // Excluye el paciente cuyo ID coincide con el que estamos editando.
        },
      });
      if (existingPatientByEmail) {
        errors.push({
          path: ["email"],
          message: "Este email ya está registrado por otro paciente.",
        });
      }
    }

    // 3. Verificación de unicidad para RUT (excluyendo el paciente actual).
    // Solo verifica si el RUT está presente en los datos validados.
    if (validatedData.rut) {
      const existingPatientByRut = await Paciente.findOne({
        where: {
          rut: validatedData.rut,
          paciente_id: { [Op.ne]: id }, // Excluye el paciente cuyo ID coincide con el que estamos editando.
        },
      });
      if (existingPatientByRut) {
        errors.push({
          path: ["rut"],
          message: "Este RUT ya está registrado por otro paciente.",
        });
      }
    }

    // 4. Si se encontraron uno o más errores de duplicidad, envía la respuesta 409.
    if (errors.length > 0) {
      if (errors.length === 2) {
        generalMessage =
          "El email y el RUT ya están registrados por otro paciente.";
      } else if (errors.length === 1) {
        generalMessage = errors[0].message;
      }
      return res.status(409).json({
        message: generalMessage,
        errors: errors,
      });
    }

    // 5. Busca el paciente por ID para actualizarlo.
    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }

    // 6. Si no hay errores de unicidad, procede con la actualización del paciente.
    await paciente.update(validatedData);
    res.status(200).json({
      message: "Paciente actualizado exitosamente",
      paciente: paciente,
    });
  } catch (error) {
    // 7. Manejo de errores (similar a createPaciente).
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
          message = "Este email ya está registrado para otro paciente.";
        } else if (constraintName.includes("rut")) {
          field = "rut";
          message = "Este RUT ya está registrado para otro paciente.";
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

/**
 * Controlador para eliminar un paciente.
 * @param {Object} req - Objeto de solicitud de Express (req.params.id contiene el ID del paciente).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const deletePaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Intenta eliminar el paciente por su ID.
    const result = await Paciente.destroy({
      where: { paciente_id: id },
    });
    // Si no se eliminó ninguna fila (resultado es 0), significa que el paciente no fue encontrado.
    if (result === 0) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }
    res.status(200).json({ message: "Paciente eliminado exitosamente." });
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
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
