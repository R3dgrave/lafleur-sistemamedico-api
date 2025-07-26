const {
  Cita,
  Paciente,
  TipoAtencion,
  Administrador,
} = require("../../models/index");
const {
  createCitaSchema,
  updateCitaSchema,
} = require("../utils/validation");
const { Op } = require("sequelize");
const { _getAvailableSlotsData } = require("./availability.controller");
const { DateTime } = require("luxon");
const CHILE_TIMEZONE = "America/Santiago";

/**
 * Valida si una franja horaria específica está disponible para un administrador y tipo de atención.
 * Esta función consulta los horarios disponibles y las citas/excepciones existentes
 * para determinar si la franja solicitada puede ser ocupada.
 * @param {number} administradorId - ID del administrador para quien se busca la disponibilidad.
 * @param {string} requestedDateISO - Fecha solicitada en formato ISO (YYYY-MM-DD) para la cita.
 * @param {number} tipoAtencionId - ID del tipo de atención para determinar la duración de la cita.
 * @param {string} requestedStartISO - Fecha y hora de inicio solicitada en formato ISO (UTC) de la cita.
 * @param {number} [excludeCitaId] - Opcional: ID de la cita a excluir de la verificación de superposición.
 * Útil al actualizar una cita para que no se considere a sí misma como ocupada.
 * @returns {Promise<boolean>} - `true` si la franja está disponible, `false` en caso contrario.
 */
const validateAppointmentAvailability = async (
  administradorId,
  requestedDateISO,
  tipoAtencionId,
  requestedStartISO,
  excludeCitaId = null
) => {
  // Busca el tipo de atención para obtener su duración.
  const tipoAtencion = await TipoAtencion.findByPk(tipoAtencionId);
  if (!tipoAtencion) {
    // Si el tipo de atención no se encuentra, se lanza un error.
    // En un flujo ideal, Zod ya debería haber validado esto, pero es un chequeo de seguridad.
    throw new Error("Tipo de atención no encontrado.");
  }

  const duracionCita = tipoAtencion.duracion_minutos;

  // Convierte la hora de inicio solicitada a la zona horaria de Chile y al inicio del minuto.
  const requestedStartDateTimeLocal = DateTime.fromISO(requestedStartISO, {
    zone: "utc",
  })
    .setZone(CHILE_TIMEZONE)
    .startOf("minute");

  // Calcula la hora de fin de la cita sumando la duración.
  const requestedEndDateTimeLocal = requestedStartDateTimeLocal.plus({
    minutes: duracionCita,
  });

  // Obtiene todas las franjas horarias disponibles para el administrador en la fecha y tipo de atención.
  // Se pasa `excludeCitaId` para que la lógica de disponibilidad ignore la cita que se está actualizando.
  const availableSlots = await _getAvailableSlotsData(
    administradorId,
    requestedDateISO,
    tipoAtencionId,
    excludeCitaId
  );

  // Verifica si la franja horaria solicitada coincide exactamente con alguna de las franjas disponibles.
  const isSlotAvailable = availableSlots.some((slot) => {
    const slotStartLocal = DateTime.fromISO(slot.start, { zone: "utc" })
      .setZone(CHILE_TIMEZONE)
      .startOf("minute");
    const slotEndLocal = DateTime.fromISO(slot.end, { zone: "utc" })
      .setZone(CHILE_TIMEZONE)
      .startOf("minute");

    return (
      requestedStartDateTimeLocal.equals(slotStartLocal) &&
      requestedEndDateTimeLocal.equals(slotEndLocal)
    );
  });

  return isSlotAvailable;
};

const createCita = async (req, res, next) => {
  try {
    // Valida los datos de entrada usando el esquema Zod para creación de citas.
    const validatedData = createCitaSchema.parse(req.body);

    const { paciente_id, administrador_id, fecha_hora_cita, tipo_atencion_id } =
      validatedData;

    // 1. Verificar existencia de Paciente, Administrador y TipoAtencion
    // Se utilizan Promise.all para ejecutar las búsquedas de forma concurrente,
    // mejorando el rendimiento al no esperar una promesa para iniciar la siguiente.
    const [paciente, administrador, tipoAtencion] = await Promise.all([
      Paciente.findByPk(paciente_id),
      Administrador.findByPk(administrador_id),
      TipoAtencion.findByPk(tipo_atencion_id),
    ]);

    const errors = []; // Array para recolectar errores de validación de entidades relacionadas.
    if (!paciente) {
      errors.push({ path: ['paciente_id'], message: 'Paciente no encontrado.' });
    }
    if (!administrador) {
      errors.push({ path: ['administrador_id'], message: 'Administrador no encontrado.' });
    }
    if (!tipoAtencion) {
      errors.push({ path: ['tipo_atencion_id'], message: 'Tipo de atención no encontrado.' });
    }

    // Si se encontraron errores en las entidades relacionadas, se devuelve una respuesta 404.
    if (errors.length > 0) {
      return res.status(404).json({
        message: "Errores al verificar entidades relacionadas.",
        errors: errors,
      });
    }

    // 2. Validar disponibilidad de la franja horaria
    // Se obtiene solo la fecha de la cita solicitada para la validación de disponibilidad.
    const requestedDateISO = DateTime.fromJSDate(fecha_hora_cita, { zone: "utc" })
      .setZone(CHILE_TIMEZONE)
      .toISODate();

    // Se llama a la función auxiliar para verificar si la franja horaria está disponible.
    const isAvailable = await validateAppointmentAvailability(
      administrador_id,
      requestedDateISO,
      tipo_atencion_id,
      fecha_hora_cita.toISOString() // Se pasa la fecha y hora completa en formato ISO para la verificación.
    );

    // Si la franja horaria no está disponible, se añade un error y se devuelve una respuesta 400.
    if (!isAvailable) {
      errors.push({ path: ['fecha_hora_cita'], message: 'La franja horaria seleccionada no está disponible o se superpone con otra cita/excepción.' });
      return res.status(400).json({
        message: "Error de disponibilidad de cita.",
        errors: errors,
      });
    }

    // 3. Si todas las validaciones pasan, se crea la cita en la base de datos.
    const newCita = await Cita.create(validatedData);
    res
      .status(201)
      .json({ message: "Cita creada exitosamente.", cita: newCita });
  } catch (error) {
    if (error.name === "ZodError") {
      // Si el error es de Zod (validación del esquema), se mapean los errores para el frontend.
      const zodErrors = error.errors.map(issue => ({
        path: issue.path,
        message: issue.message
      }));
      return res.status(400).json({
        message: "Error de validación de datos.",
        errors: zodErrors,
      });
    }
    // Para cualquier otro tipo de error no manejado específicamente, se pasa al siguiente middleware de error.
    next(error);
  }
};

const getAllCitas = async (req, res, next) => {
  try {
    // Extrae los parámetros de filtro de la query string.
    const {
      paciente_id,
      tipo_atencion_id,
      estado_cita,
      fecha_inicio,
      fecha_fin,
    } = req.query;
    const whereClause = {}; // Objeto para construir las condiciones de la consulta.

    // Añade condiciones al `whereClause` si los filtros están presentes.
    if (paciente_id) whereClause.paciente_id = paciente_id;
    if (tipo_atencion_id) whereClause.tipo_atencion_id = tipo_atencion_id;
    if (estado_cita) whereClause.estado_cita = estado_cita;

    // Manejo de filtros por rango de fechas.
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_hora_cita = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    } else if (fecha_inicio) {
      whereClause.fecha_hora_cita = {
        [Op.gte]: new Date(fecha_inicio), // Greater than or equal (mayor o igual que)
      };
    } else if (fecha_fin) {
      whereClause.fecha_hora_cita = {
        [Op.lte]: new Date(fecha_fin), // Less than or equal (menor o igual que)
      };
    }

    // Busca todas las citas que coinciden con los filtros, incluyendo datos relacionados.
    const citas = await Cita.findAll({
      where: whereClause,
      include: [
        {
          model: Paciente, // Incluye los datos del Paciente asociado.
          attributes: ["paciente_id", "nombre", "apellido", "email", "rut"], // Selecciona solo atributos específicos.
        },
        { model: TipoAtencion, attributes: ["nombre_atencion"] }, // Incluye el nombre del TipoAtencion.
        { model: Administrador, attributes: ["nombre", "apellido", "email"] }, // Incluye nombre y email del Administrador.
      ],
      order: [["fecha_hora_cita", "ASC"]], // Ordena las citas por fecha y hora ascendente.
    });
    res.status(200).json(citas);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

const getCitasByPacienteRut = async (req, res, next) => {
  try {
    const { rut } = req.params;

    // Busca el paciente por RUT para obtener su ID.
    const paciente = await Paciente.findOne({ where: { rut: rut } });
    if (!paciente) {
      return res
        .status(404)
        .json({ message: "Paciente no encontrado con el RUT proporcionado." });
    }
    const paciente_id = paciente.paciente_id; // Obtiene el ID del paciente.

    // Busca todas las citas asociadas a ese paciente.
    const citas = await Cita.findAll({
      where: { paciente_id },
      include: [
        {
          model: Paciente,
          attributes: ["paciente_id", "nombre", "apellido", "email", "rut"],
        },
        { model: TipoAtencion, attributes: ["nombre_atencion"] },
        { model: Administrador, attributes: ["nombre", "apellido", "email"] },
      ],
      order: [["fecha_hora_cita", "ASC"]],
    });

    // Si no se encuentran citas, devuelve un array vacío (status 200).
    if (citas.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(citas);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

const updateCita = async (req, res, next) => {
  try {
    const { id } = req.params; // ID de la cita a actualizar.
    // Valida los datos de entrada usando el esquema Zod para actualización de citas.
    const validatedData = updateCitaSchema.parse(req.body);

    // Busca la cita existente por su ID, incluyendo datos de TipoAtencion y Paciente.
    const cita = await Cita.findByPk(id, {
      include: [
        {
          model: TipoAtencion,
          attributes: ["duracion_minutos", "buffer_minutos"],
        },
        {
          model: Paciente,
          attributes: ["paciente_id", "nombre", "apellido", "email", "rut"],
        },
      ],
    });
    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada." });
    }

    const errors = []; // Array para recolectar errores de validación.

    // Validar existencia de entidades relacionadas si se están actualizando
    // Se verifica si el ID de paciente, administrador o tipo de atención ha cambiado
    // y si el nuevo ID corresponde a una entidad existente.
    if (validatedData.paciente_id && validatedData.paciente_id !== cita.paciente_id) {
      const paciente = await Paciente.findByPk(validatedData.paciente_id);
      if (!paciente) errors.push({ path: ['paciente_id'], message: 'Nuevo paciente asociado no encontrado.' });
    }
    if (validatedData.administrador_id && validatedData.administrador_id !== cita.administrador_id) {
        const administrador = await Administrador.findByPk(validatedData.administrador_id);
        if (!administrador) errors.push({ path: ['administrador_id'], message: 'Nuevo administrador asociado no encontrado.' });
    }
    if (validatedData.tipo_atencion_id && validatedData.tipo_atencion_id !== cita.tipo_atencion_id) {
      const tipoAtencion = await TipoAtencion.findByPk(validatedData.tipo_atencion_id);
      if (!tipoAtencion) errors.push({ path: ['tipo_atencion_id'], message: 'Nuevo tipo de atención asociado no encontrado.' });
    }

    // Si hay errores de entidades relacionadas, se devuelven con status 404.
    if (errors.length > 0) {
        return res.status(404).json({
            message: "Errores al verificar entidades relacionadas para la actualización.",
            errors: errors
        });
    }

    // Validar disponibilidad de la franja horaria si la fecha/hora o el tipo de atención/administrador cambian.
    // Esto es importante para evitar superposiciones de citas al mover o cambiar una cita existente.
    if (validatedData.fecha_hora_cita || validatedData.tipo_atencion_id || validatedData.administrador_id) {
        // Determina los IDs y la fecha/hora a usar para la validación (usa el nuevo valor si está presente, sino el original).
        const currentTipoAtencionId = validatedData.tipo_atencion_id || cita.tipo_atencion_id;
        const currentAdministradorId = validatedData.administrador_id || cita.administrador_id;
        const currentFechaHoraCita = validatedData.fecha_hora_cita ? new Date(validatedData.fecha_hora_cita) : new Date(cita.fecha_hora_cita);

        // Se verifica que las dependencias clave para la validación de disponibilidad existan.
        const tipoAtencionParaValidacion = await TipoAtencion.findByPk(currentTipoAtencionId);
        if (!currentAdministradorId || !tipoAtencionParaValidacion) {
            errors.push({ path: ['administrador_id', 'tipo_atencion_id'], message: 'Administrador y/o Tipo de Atención son requeridos para validar la disponibilidad.' });
            return res.status(400).json({
                message: "Faltan datos para validar disponibilidad.",
                errors: errors
            });
        }

        // Obtiene la fecha en formato ISO para la validación.
        const requestedDateISO = DateTime.fromJSDate(currentFechaHoraCita, { zone: "utc" })
            .setZone(CHILE_TIMEZONE)
            .toISODate();

        // Llama a la función auxiliar de validación de disponibilidad, excluyendo la cita actual.
        const isAvailable = await validateAppointmentAvailability(
            currentAdministradorId,
            requestedDateISO,
            currentTipoAtencionId,
            currentFechaHoraCita.toISOString(),
            id // Pasa el ID de la cita actual para que no se considere a sí misma como una superposición.
        );

        // Si la franja horaria no está disponible, se añade un error y se devuelve una respuesta 400.
        if (!isAvailable) {
            errors.push({ path: ['fecha_hora_cita'], message: 'La franja horaria solicitada no está disponible o se superpone con otra cita/excepción.' });
            return res.status(400).json({
                message: "Error de disponibilidad de cita para la actualización.",
                errors: errors
            });
        }
    }

    // Si todas las validaciones pasan, se actualiza la cita en la base de datos.
    await cita.update(validatedData);

    res.status(200).json({
      message: "Cita actualizada exitosamente",
      cita: cita,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      // Si el error es de Zod (validación del esquema), se mapean los errores para el frontend.
      const zodErrors = error.errors.map(issue => ({
        path: issue.path,
        message: issue.message
      }));
      return res.status(400).json({
        message: "Error de validación de datos.",
        errors: zodErrors,
      });
    }
    next(error); // Pasa cualquier otro error al siguiente middleware.
  }
};

const deleteCita = async (req, res, next) => {
  try {
    const { id } = req.params; // ID de la cita a eliminar.

    // Intenta eliminar la cita por su ID.
    const result = await Cita.destroy({
      where: { cita_id: id },
    });

    // Si no se eliminó ninguna fila (resultado es 0), significa que la cita no fue encontrada.
    if (result === 0) {
      return res.status(404).json({ message: "Cita no encontrada." });
    }

    res.status(200).json({ message: "Cita eliminada exitosamente." });
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

module.exports = {
  createCita,
  getAllCitas,
  updateCita,
  deleteCita,
  getCitasByPacienteRut,
};
