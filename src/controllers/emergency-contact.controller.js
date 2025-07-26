const { ContactoEmergencia, Paciente } = require("../../models/index");
const {
  createContactoEmergenciaSchema,
  updateContactoEmergenciaSchema,
} = require("../utils/validation");

/**
 * Función auxiliar interna para obtener el ID de un paciente por su RUT.
 * Lanza un error si el paciente no es encontrado, que será capturado por el controlador principal.
 * @param {string} rut - El RUT del paciente a buscar.
 * @returns {Promise<number>} El ID del paciente.
 * @throws {Error} Con `statusCode: 404` si el paciente no es encontrado.
 */
const _getPacienteIdByRut = async (rut) => {
  const paciente = await Paciente.findOne({ where: { rut } });
  if (!paciente) {
    const error = new Error("Paciente con el RUT especificado no encontrado.");
    error.statusCode = 404; // Asigna un código de estado para el middleware de errores.
    throw error;
  }
  return paciente.paciente_id;
};

/**
 * Crea un nuevo contacto de emergencia para un paciente.
 * Valida los datos, busca el paciente por RUT y asocia el contacto.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const createContactoEmergencia = async (req, res, next) => {
  try {
    // Valida los datos del cuerpo de la solicitud usando el esquema Zod.
    const validatedData = createContactoEmergenciaSchema.parse(req.body);
    // Extrae el rut_paciente y el resto de los datos del contacto.
    const { rut_paciente, ...contactData } = validatedData;

    // Obtiene el paciente_id a partir del RUT. Si el paciente no existe, _getPacienteIdByRut lanzará un error.
    const paciente_id = await _getPacienteIdByRut(rut_paciente);

    // Crea el nuevo contacto de emergencia en la base de datos.
    const newContacto = await ContactoEmergencia.create({
      paciente_id, // Asocia el contacto con el ID del paciente encontrado.
      ...contactData,
    });

    res.status(201).json({
      message: "Contacto de emergencia registrado exitosamente",
      contacto: newContacto,
    });
  } catch (error) {
    // Pasa cualquier error (incluyendo ZodError o el error lanzado por _getPacienteIdByRut)
    // al middleware centralizado de manejo de errores.
    next(error);
  }
};

/**
 * Obtiene todos los contactos de emergencia, opcionalmente filtrados por paciente_id.
 * @param {Object} req - Objeto de solicitud de Express (req.query.paciente_id para filtrar).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAllContactosEmergencia = async (req, res, next) => {
  try {
    const { paciente_id } = req.query;
    const whereClause = {}; // Objeto para construir las condiciones de la consulta.

    // Si se proporciona paciente_id en la query, se añade al filtro.
    if (paciente_id) {
      whereClause.paciente_id = paciente_id;
    }

    // Busca todos los contactos de emergencia que coincidan con el filtro, incluyendo datos del paciente.
    const contactos = await ContactoEmergencia.findAll({
      where: whereClause,
      include: [{ model: Paciente, attributes: ["nombre", "apellido"] }], // Incluye nombre y apellido del paciente.
    });
    res.status(200).json(contactos);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

/**
 * Obtiene contactos de emergencia para un paciente específico por su RUT.
 * @param {Object} req - Objeto de solicitud de Express (req.params.rut contiene el RUT del paciente).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getContactosEmergenciaByPacienteRut = async (req, res, next) => {
  try {
    const { rut } = req.params;
    // Obtiene el paciente_id a partir del RUT. Si el paciente no existe, _getPacienteIdByRut lanzará un error.
    const paciente_id = await _getPacienteIdByRut(rut);

    // Busca todos los contactos de emergencia asociados a ese paciente_id.
    const contactos = await ContactoEmergencia.findAll({
      where: { paciente_id },
      include: [
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "rut"], // Incluye datos relevantes del paciente.
        },
      ],
      order: [["nombre_contacto", "ASC"]], // Ordena los contactos por nombre.
    });

    // Si no se encuentran contactos para el paciente, devuelve un 404.
    if (contactos.length === 0) {
      const error = new Error(
        "No se encontraron contactos de emergencia para el paciente con el RUT proporcionado."
      );
      error.statusCode = 404;
      return next(error); // Pasa el error al middleware de errores.
    }

    res.status(200).json(contactos);
  } catch (error) {
    next(error); // Pasa cualquier error (incluyendo el de _getPacienteIdByRut) al siguiente middleware.
  }
};

/**
 * Obtiene un contacto de emergencia por su ID.
 * @param {Object} req - Objeto de solicitud de Express (req.params.id contiene el ID del contacto).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getContactoEmergenciaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Busca el contacto de emergencia por su clave primaria (ID), incluyendo datos del paciente.
    const contacto = await ContactoEmergencia.findByPk(id, {
      include: [{ model: Paciente, attributes: ["nombre", "apellido"] }],
    });
    if (!contacto) {
      // Si el contacto no se encuentra, devuelve un 404.
      const error = new Error("Contacto de emergencia no encontrado.");
      error.statusCode = 404;
      return next(error); // Pasa el error al middleware de errores.
    }
    res.status(200).json(contacto);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

/**
 * Actualiza un contacto de emergencia existente.
 * Permite actualizar el paciente asociado si se proporciona un nuevo RUT.
 * @param {Object} req - Objeto de solicitud de Express (req.params.id contiene el ID del contacto).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const updateContactoEmergencia = async (req, res, next) => {
  try {
    const { id } = req.params; // ID del contacto a actualizar.
    // Valida los datos del cuerpo de la solicitud usando el esquema Zod.
    const validatedData = updateContactoEmergenciaSchema.parse(req.body);
    // Extrae el rut_paciente y el resto de los datos del contacto.
    const { rut_paciente, ...contactData } = validatedData;

    // Busca el contacto de emergencia existente.
    const contacto = await ContactoEmergencia.findByPk(id);
    if (!contacto) {
      // Si el contacto no se encuentra, devuelve un 404.
      const error = new Error("Contacto de emergencia no encontrado.");
      error.statusCode = 404;
      return next(error); // Pasa el error al middleware de errores.
    }

    let newPacienteId = contacto.paciente_id; // Por defecto, mantiene el paciente_id actual.
    // Si se proporciona un nuevo RUT de paciente, busca el ID correspondiente.
    if (rut_paciente) {
      newPacienteId = await _getPacienteIdByRut(rut_paciente); // _getPacienteIdByRut lanzará un error si no lo encuentra.
    }

    // Actualiza el contacto con los nuevos datos y el posible nuevo paciente_id.
    await contacto.update({
      paciente_id: newPacienteId,
      ...contactData,
    });

    res.status(200).json({
      message: "Contacto de emergencia actualizado exitosamente",
      contacto: contacto,
    });
  } catch (error) {
    // Pasa cualquier error (incluyendo ZodError o el error lanzado por _getPacienteIdByRut)
    // al middleware centralizado de manejo de errores.
    next(error);
  }
};

/**
 * Elimina un contacto de emergencia existente.
 * @param {Object} req - Objeto de solicitud de Express (req.params.id contiene el ID del contacto).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const deleteContactoEmergencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Intenta eliminar el contacto de emergencia por su ID.
    const result = await ContactoEmergencia.destroy({
      where: { contacto_emergencia_id: id },
    });
    // Si no se eliminó ninguna fila (resultado es 0), significa que el contacto no fue encontrado.
    if (result === 0) {
      const error = new Error("Contacto de emergencia no encontrado.");
      error.statusCode = 404;
      return next(error); // Pasa el error al middleware de errores.
    }
    res
      .status(200)
      .json({ message: "Contacto de emergencia eliminado exitosamente." });
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

module.exports = {
  createContactoEmergencia,
  getAllContactosEmergencia,
  getContactosEmergenciaByPacienteRut,
  getContactoEmergenciaById,
  updateContactoEmergencia,
  deleteContactoEmergencia,
  // La función _getPacienteIdByRut no se exporta ya que es una utilidad interna del controlador.
};
