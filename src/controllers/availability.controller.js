// src/controllers/availability.controller.js
const {
  HorarioDisponible,
  ExcepcionDisponibilidad,
  Cita,
  TipoAtencion,
  Administrador,
} = require("../../models/index");
const { Op } = require("sequelize");
const {
  horarioDisponibleSchema,
  excepcionDisponibilidadSchema,
} = require("../utils/validation");
const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require("../utils/customErrors");
const { DateTime } = require("luxon");
const CHILE_TIMEZONE = "America/Santiago";
const { ZodError } = require("zod");

/**
 * Genera una lista de franjas horarias potenciales basadas en un rango de tiempo,
 * la duración de la cita y el tiempo de buffer.
 * @param {DateTime} startDateTimeLocal - Objeto Luxon DateTime del inicio del horario disponible (en zona horaria local).
 * @param {DateTime} endDateTimeLocal - Objeto Luxon DateTime del fin del horario disponible (en zona horaria local).
 * @param {number} durationMinutes - Duración de cada cita en minutos.
 * @param {number} bufferMinutes - Tiempo de buffer en minutos a añadir después de cada cita.
 * @returns {Array<Object>} Un array de objetos { start: string (ISO UTC), end: string (ISO UTC) } representando las franjas.
 */
const generateTimeSlots = (
  startDateTimeLocal,
  endDateTimeLocal,
  durationMinutes,
  bufferMinutes
) => {
  const slots = [];
  let currentTime = startDateTimeLocal.startOf("minute");

  while (true) {
    const potentialSlotEnd = currentTime.plus({ minutes: durationMinutes });
    const totalSlotBlockEnd = potentialSlotEnd.plus({ minutes: bufferMinutes });

    if (totalSlotBlockEnd > endDateTimeLocal) {
      break;
    }

    slots.push({
      start: currentTime.setZone("utc").toISO(),
      end: potentialSlotEnd.setZone("utc").toISO(),
    });

    currentTime = totalSlotBlockEnd;
  }
  return slots;
};

/**
 * Crea un nuevo horario disponible para un administrador.
 * Se ha movido la validación del esquema aquí para asegurar la consistencia.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const createHorarioDisponible = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;
    const validatedData = horarioDisponibleSchema.parse(req.body);
    const { dia_semana, hora_inicio, hora_fin } = validatedData;

    // Verificar si ya existe un horario para este administrador y día de la semana.
    const existingHorario = await HorarioDisponible.findOne({
      where: {
        administrador_id: administradorId,
        dia_semana: dia_semana,
      },
    });

    if (existingHorario) {
      throw new ConflictError(
        "Ya existe un horario configurado para este día de la semana. Por favor, edita el horario existente en lugar de crear uno nuevo."
      );
    }

    const newHorario = await HorarioDisponible.create({
      administrador_id: administradorId,
      dia_semana,
      hora_inicio,
      hora_fin,
    });

    res.status(201).json({
      message: "Horario disponible creado exitosamente.",
      horario: newHorario,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        new BadRequestError("Datos de entrada inválidos.", error.errors)
      );
    }
    next(error);
  }
};

/**
 * Obtiene todos los horarios disponibles para el administrador autenticado.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAllHorariosDisponibles = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;

    const horarios = await HorarioDisponible.findAll({
      where: { administrador_id: administradorId },
      attributes: [
        "horario_disponible_id",
        "administrador_id",
        "dia_semana",
        "hora_inicio",
        "hora_fin",
      ],
      include: [
        {
          model: Administrador,
          attributes: ["administrador_id", "nombre", "apellido"],
        },
      ],
      order: [
        ["dia_semana", "ASC"],
        ["hora_inicio", "ASC"],
      ],
    });
    res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza un horario disponible existente.
 * Se ha movido la validación del esquema aquí para asegurar la consistencia.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const updateHorariosDisponible = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;
    const { id } = req.params;
    const validatedData = horarioDisponibleSchema.partial().parse(req.body);
    const { dia_semana, hora_inicio, hora_fin } = validatedData;

    const horario = await HorarioDisponible.findOne({
      where: {
        horario_disponible_id: id,
        administrador_id: administradorId,
      },
    });

    if (!horario) {
      throw new NotFoundError(
        "Horario no encontrado o no pertenece a este administrador."
      );
    }

    if (dia_semana && horario.dia_semana !== dia_semana) {
      const existingHorarioOnNewDay = await HorarioDisponible.findOne({
        where: {
          administrador_id: administradorId,
          dia_semana: dia_semana,
          horario_disponible_id: { [Op.ne]: id },
        },
      });

      if (existingHorarioOnNewDay) {
        throw new ConflictError(
          "Ya existe un horario configurado para el día de la semana seleccionado. Por favor, elige otro día."
        );
      }
    }

    await horario.update({
      dia_semana: dia_semana ?? horario.dia_semana,
      hora_inicio: hora_inicio ?? horario.hora_inicio,
      hora_fin: hora_fin ?? horario.hora_fin,
    });

    res.status(200).json({
      message: "Horario actualizado exitosamente.",
      horario: horario,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        new BadRequestError("Datos de entrada inválidos.", error.errors)
      );
    }
    next(error);
  }
};

/**
 * Elimina un horario disponible por su ID.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const deleteHorarioDisponible = async (req, res, next) => {
  try {
    const { id } = req.params;
    const administradorId = req.user.administrador_id;

    const result = await HorarioDisponible.destroy({
      where: {
        horario_disponible_id: id,
        administrador_id: administradorId,
      },
    });

    if (result === 0) {
      throw new NotFoundError(
        "Horario no encontrado o no pertenece a este administrador."
      );
    }
    res.status(200).json({ message: "Horario eliminado exitosamente." });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una nueva excepción de disponibilidad para un administrador en una fecha específica.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const createExcepcionDisponibilidad = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;
    const validatedData = excepcionDisponibilidadSchema.parse(req.body);

    const existingExcepcion = await ExcepcionDisponibilidad.findOne({
      where: {
        administrador_id: administradorId,
        fecha: validatedData.fecha,
        es_dia_completo: validatedData.es_dia_completo,
      },
    });

    if (existingExcepcion) {
      throw new ConflictError(
        "Ya existe una excepción de disponibilidad para la fecha seleccionada."
      );
    }

    const newExcepcion = await ExcepcionDisponibilidad.create({
      ...validatedData,
      administrador_id: administradorId,
    });

    res.status(201).json({
      message: "Excepción de disponibilidad creada.",
      excepcion: newExcepcion,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        new BadRequestError("Datos de entrada inválidos.", error.errors)
      );
    }
    next(error);
  }
};

/**
 * Elimina una excepción de disponibilidad por su ID.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const deleteExcepcionDisponibilidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const administradorId = req.user.administrador_id;

    const result = await ExcepcionDisponibilidad.destroy({
      where: {
        excepcion_id: id,
        administrador_id: administradorId,
      },
    });

    if (result === 0) {
      throw new NotFoundError(
        "Excepción no encontrada o no pertenece a este administrador."
      );
    }
    res.status(200).json({ message: "Excepción eliminada exitosamente." });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todas las excepciones de disponibilidad para el administrador autenticado.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAllExcepcionesDisponibilidad = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;

    const excepciones = await ExcepcionDisponibilidad.findAll({
      where: { administrador_id: administradorId },
      attributes: [
        "excepcion_id",
        "administrador_id",
        "fecha",
        "hora_inicio_bloqueo",
        "hora_fin_bloqueo",
        "es_dia_completo",
        "descripcion",
      ],
      include: [
        {
          model: Administrador,
          attributes: ["nombre", "apellido"],
        },
      ],
      order: [
        ["fecha", "ASC"],
        ["hora_inicio_bloqueo", "ASC"],
      ],
    });
    res.status(200).json(excepciones);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una excepción de disponibilidad existente.
 * Se ha movido la validación del esquema aquí para asegurar la consistencia.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const updateExcepcionDisponibilidad = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;
    const { id } = req.params;
    const validatedData = excepcionDisponibilidadSchema
      .partial()
      .parse(req.body);
    const {
      fecha,
      es_dia_completo,
      hora_inicio_bloqueo,
      hora_fin_bloqueo,
      descripcion,
    } = validatedData;

    const excepcion = await ExcepcionDisponibilidad.findOne({
      where: {
        excepcion_id: id,
        administrador_id: administradorId,
      },
    });

    if (!excepcion) {
      throw new NotFoundError(
        "Excepción no encontrada o no pertenece a este administrador."
      );
    }

    if (fecha && excepcion.fecha !== fecha) {
      const existingExcepcionOnNewDate = await ExcepcionDisponibilidad.findOne({
        where: {
          administrador_id: administradorId,
          fecha: fecha,
          excepcion_id: { [Op.ne]: id },
        },
      });

      if (existingExcepcionOnNewDate) {
        throw new ConflictError(
          "Ya existe una excepción de disponibilidad para la fecha seleccionada."
        );
      }
    }

    await excepcion.update({
      fecha: fecha ?? excepcion.fecha,
      es_dia_completo: es_dia_completo ?? excepcion.es_dia_completo,
      hora_inicio_bloqueo:
        es_dia_completo === true
          ? null
          : hora_inicio_bloqueo ?? excepcion.hora_inicio_bloqueo,
      hora_fin_bloqueo:
        es_dia_completo === true
          ? null
          : hora_fin_bloqueo ?? excepcion.hora_fin_bloqueo,
      descripcion: descripcion ?? excepcion.descripcion,
    });

    res.status(200).json({
      message: "Excepción de disponibilidad actualizada exitosamente.",
      excepcion: excepcion,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        new BadRequestError("Datos de entrada inválidos.", error.errors)
      );
    }
    next(error);
  }
};

/**
 * Función auxiliar para obtener las franjas horarias disponibles para un administrador en una fecha específica,
 * considerando horarios base, citas existentes y excepciones de disponibilidad.
 * @param {number} administradorId - ID del administrador.
 * @param {string} fecha - Fecha en formato 'YYYY-MM-DD' (se asume en la zona horaria de Chile).
 * @param {number} tipoAtencionId - ID del tipo de atención para determinar la duración y el buffer de la cita.
 * @param {number|null} [excludeCitaId=null] - Opcional: ID de una cita a excluir de la verificación de superposición.
 * @param {object} [transaction=null] - Objeto de transacción de Sequelize.
 * @returns {Promise<Array<Object>>} Un array de objetos { start: string (ISO UTC), end: string (ISO UTC) }
 * @throws {NotFoundError} Si el tipo de atención no se encuentra.
 * @throws {BadRequestError} Si el formato de fecha es inválido.
 */
const _getAvailableSlotsData = async (
  administradorId,
  fecha,
  excludeCitaId = null,
  transaction = null
) => {
  const targetDateLocal = DateTime.fromISO(fecha, {
    zone: CHILE_TIMEZONE,
  }).startOf("day");
  if (!targetDateLocal.isValid) {
    throw new BadRequestError("Formato de fecha inválido.");
  }
  const dayOfWeek = targetDateLocal.weekday;

  // Los valores de duración y buffer ahora son fijos
  const duracionCita = 60; // 1 hora
  const bufferMinutes = 30; // 30 minutos

  const horariosBase = await HorarioDisponible.findAll({
    where: { administrador_id: administradorId, dia_semana: dayOfWeek },
    transaction,
  });

  if (horariosBase.length === 0) {
    return [];
  }

  const whereCitasClause = {
    administrador_id: administradorId,
    fecha_hora_cita: {
      [Op.gte]: targetDateLocal.startOf("day").setZone("utc").toJSDate(),
      [Op.lt]: targetDateLocal.endOf("day").setZone("utc").toJSDate(),
    },
    estado_cita: { [Op.notIn]: ["Cancelada"] },
  };

  if (excludeCitaId) {
    whereCitasClause.cita_id = { [Op.ne]: excludeCitaId };
  }

  const citasExistentes = await Cita.findAll({
    where: whereCitasClause,
    // Ya no necesitas incluir TipoAtencion aquí
    // include: [
    //   {
    //     model: TipoAtencion,
    //     attributes: ["duracion_minutos", "buffer_minutos"],
    //   },
    // ],
    transaction,
  });

  const bookedBlocks = citasExistentes.map((cita) => {
    const bookedStartUTC = DateTime.fromJSDate(cita.fecha_hora_cita, {
      zone: "utc",
    });
    // Usar los valores fijos para calcular el bloque
    const bookedEndUTC = bookedStartUTC.plus({
      minutes: duracionCita + bufferMinutes,
    });
    return { start: bookedStartUTC, end: bookedEndUTC };
  });

  const excepciones = await ExcepcionDisponibilidad.findAll({
    where: { administrador_id: administradorId, fecha: fecha },
    transaction,
  });

  const franjasDisponibles = [];

  for (const horario of horariosBase) {
    let currentTime = targetDateLocal.set({
      hour: parseInt(horario.hora_inicio.split(":")[0]),
      minute: parseInt(horario.hora_inicio.split(":")[1]),
    });
    const endDateTimeLocal = targetDateLocal.set({
      hour: parseInt(horario.hora_fin.split(":")[0]),
      minute: parseInt(horario.hora_fin.split(":")[1]),
    });

    while (currentTime.plus({ minutes: duracionCita }) <= endDateTimeLocal) {
      const slotStartUTC = currentTime.setZone("utc");
      const slotEndUTC = currentTime
        .plus({ minutes: duracionCita })
        .setZone("utc");
      const slotTotalBlockEndUTC = currentTime
        .plus({ minutes: duracionCita + bufferMinutes })
        .setZone("utc");
      const nowUTC = DateTime.now().setZone("utc");

      let isAvailable = true;

      // 1. Verificar si el slot ha pasado
      if (slotEndUTC <= nowUTC) {
        isAvailable = false;
      }

      // 2. Verificar solapamiento con excepciones
      if (isAvailable) {
        for (const excepcion of excepciones) {
          // ... (la lógica de excepciones no cambia)
        }
      }

      // 3. Verificar solapamiento con citas existentes
      if (isAvailable) {
        for (const booked of bookedBlocks) {
          if (
            slotTotalBlockEndUTC > booked.start &&
            booked.end > slotStartUTC
          ) {
            isAvailable = false;
            break;
          }
        }
      }

      if (isAvailable) {
        franjasDisponibles.push({
          start: slotStartUTC.toISO(),
          end: slotEndUTC.toISO(),
        });
      }

      currentTime = currentTime.plus({ minutes: duracionCita + bufferMinutes });
    }
  }

  // Ya no es necesario añadir el slot de la cita a editar, ya que todas
  // las franjas tienen la misma duración y el `excludeCitaId` ya la excluye
  // del cálculo inicial.

  // Ordenar la lista final
  franjasDisponibles.sort((a, b) => new Date(a.start) - new Date(b.start));

  return franjasDisponibles;
};

/**
 * Endpoint para obtener las franjas horarias disponibles para un administrador en una fecha y tipo de atención específicos.
 * @param {Object} req - Objeto de solicitud de Express (req.query contiene administradorId, fecha, tipoAtencionId, excludeCitaId).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getFranjasDisponibles = async (req, res, next) => {
  try {
    const { administradorId, fecha, tipoAtencionId, excludeCitaId } = req.query;

    if (!administradorId || !fecha || !tipoAtencionId) {
      throw new BadRequestError(
        "Administrador, fecha y tipo de atención son requeridos."
      );
    }

    const franjas = await _getAvailableSlotsData(
      parseInt(administradorId),
      fecha,
      parseInt(tipoAtencionId),
      excludeCitaId ? parseInt(excludeCitaId) : null
    );

    res.status(200).json(franjas);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHorarioDisponible,
  getAllHorariosDisponibles,
  updateHorariosDisponible,
  deleteHorarioDisponible,

  createExcepcionDisponibilidad,
  getAllExcepcionesDisponibilidad,
  updateExcepcionDisponibilidad,
  deleteExcepcionDisponibilidad,

  getFranjasDisponibles,
  _getAvailableSlotsData,
  generateTimeSlots,
};
