const { TipoAtencion } = require("../../models/index");
const { createTipoAtencionSchema } = require("../utils/validation"); // Importa el esquema de validación Zod

/**
 * Obtiene todos los tipos de atención registrados.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAllTiposAtencion = async (req, res, next) => {
  try {
    // Busca todos los tipos de atención en la base de datos, ordenados alfabéticamente por nombre.
    const tiposAtencion = await TipoAtencion.findAll({
      order: [["nombre_atencion", "ASC"]],
    });
    res.status(200).json(tiposAtencion);
  } catch (error) {
    // Pasa cualquier error al middleware centralizado de manejo de errores.
    next(error);
  }
};

/**
 * Crea un nuevo tipo de atención.
 * Valida los datos de entrada usando Zod y maneja errores de unicidad.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const createTipoAtencion = async (req, res, next) => {
  try {
    // Valida los datos del cuerpo de la solicitud usando el esquema Zod.
    // Si la validación falla (ej. nombre_atencion está vacío o no es string),
    // Zod lanzará un error que será capturado por el bloque catch y manejado por el errorHandler.
    const validatedData = createTipoAtencionSchema.parse(req.body);
    const { nombre_atencion } = validatedData;

    // Crea el nuevo tipo de atención en la base de datos.
    const newTipo = await TipoAtencion.create({ nombre_atencion });

    res.status(201).json({
      message: "Tipo de atención creado exitosamente",
      tipo: newTipo,
    });
  } catch (error) {
    // Pasa cualquier error (incluyendo ZodError o SequelizeUniqueConstraintError)
    // al middleware centralizado de manejo de errores.
    // El errorHandler se encargará de asignar el status 409 para UniqueConstraintError
    // y 400 para ZodError.
    next(error);
  }
};

module.exports = {
  getAllTiposAtencion,
  createTipoAtencion,
};
