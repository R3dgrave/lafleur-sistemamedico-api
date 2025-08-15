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
 * Función auxiliar para generar franjas horarias a partir de un rango y una duración.
 * @param {DateTime} startDateTimeLocal - Hora de inicio en formato Luxon (local).
 * @param {DateTime} endDateTimeLocal - Hora de fin en formato Luxon (local).
 * @param {number} durationMinutes - Duración de cada franja en minutos.
 * @param {number} bufferMinutes - Búfer entre franjas en minutos.
 * @returns {Array<Object>} Un array de objetos { start: string (ISO UTC), end: string (ISO UTC) }.
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
    const validatedData = createHorarioDisponibleSchema.parse(req.body);
    const { dia_semana, hora_inicio, hora_fin, administrador_id } =
      validatedData;
    const existingHorario = await HorarioDisponible.findOne({
      where: {
        administrador_id,
        dia_semana,
        [Op.or]: [
          // Comprobar si el nuevo horario se solapa con uno existente
          {
            hora_inicio: {
              [Op.lt]: hora_fin,
            },
            hora_fin: {
              [Op.gt]: hora_inicio,
            },
          },
        ],
      },
    });

    if (existingHorario) {
      throw new BadRequestError(
        "La franja horaria se solapa con un horario existente para este administrador y día de la semana."
      );
    }

    const newHorario = await HorarioDisponible.create(validatedData);
    res.status(201).json({
      message: "Horario disponible creado exitosamente.",
      horario: newHorario,
    });
  } catch (error) {
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
    const { administrador_id } = req.query;
    const whereClause = {};

    if (administrador_id) {
      whereClause.administrador_id = administrador_id;
    }

    const horarios = await HorarioDisponible.findAll({
      where: whereClause,
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
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const validatedData = updateHorarioDisponibleSchema.parse(req.body);

    const horario = await HorarioDisponible.findByPk(id, { transaction: t });
    if (!horario) {
      throw new NotFoundError("Horario no encontrado.");
    }

    const { dia_semana, hora_inicio, hora_fin, administrador_id } = {
      ...horario.get(),
      ...validatedData,
    };

    const existingHorario = await HorarioDisponible.findOne({
      where: {
        horario_id: { [Op.ne]: id },
        administrador_id,
        dia_semana,
        [Op.or]: [
          {
            hora_inicio: {
              [Op.lt]: hora_fin,
            },
            hora_fin: {
              [Op.gt]: hora_inicio,
            },
          },
        ],
      },
      transaction: t,
    });

    if (existingHorario) {
      throw new BadRequestError(
        "La franja horaria actualizada se solapa con un horario existente."
      );
    }

    await horario.update(validatedData, { transaction: t });
    await t.commit();
    res
      .status(200)
      .json({ message: "Horario disponible actualizado exitosamente." });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
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
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const result = await HorarioDisponible.destroy({
      where: { horario_id: id },
      transaction: t,
    });
    if (result === 0) {
      throw new NotFoundError("Horario disponible no encontrado.");
    }
    await t.commit();
    res
      .status(200)
      .json({ message: "Horario disponible eliminado exitosamente." });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
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
    const validatedData = createExcepcionDisponibilidadSchema.parse(req.body);
    const newExcepcion = await ExcepcionDisponibilidad.create(validatedData);
    res.status(201).json({
      message: "Excepción de disponibilidad creada exitosamente.",
      excepcion: newExcepcion,
    });
  } catch (error) {
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
    const result = await ExcepcionDisponibilidad.destroy({
      where: { excepcion_id: id },
    });
    if (result === 0) {
      throw new NotFoundError("Excepción de disponibilidad no encontrada.");
    }
    res
      .status(200)
      .json({ message: "Excepción de disponibilidad eliminada exitosamente." });
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
    const { administrador_id, fecha_inicio, fecha_fin } = req.query;
    const whereClause = {};

    if (administrador_id) {
      whereClause.administrador_id = administrador_id;
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [fecha_inicio, fecha_fin],
      };
    }

    const excepciones = await ExcepcionDisponibilidad.findAll({
      where: whereClause,
      order: [["fecha", "ASC"]],
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
    const { id } = req.params;
    const validatedData = updateExcepcionDisponibilidadSchema.parse(req.body);
    const excepcion = await ExcepcionDisponibilidad.findByPk(id);
    if (!excepcion) {
      throw new NotFoundError("Excepción no encontrada.");
    }
    await excepcion.update(validatedData);
    res.status(200).json({
      message: "Excepción de disponibilidad actualizada exitosamente.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Función auxiliar para obtener las franjas horarias disponibles para un administrador en una fecha específica,
 * considerando horarios base, citas existentes y excepciones de disponibilidad.
 * @param {number} administradorId - ID del administrador.
 * @param {string} fecha - Fecha en formato 'YYYY-MM-DD' (se asume en la zona horaria de Chile).
 * @param {number} tipoAtencionId - ID del tipo de atención para determinar la duración y el buffer de la cita que se quiere agendar.
 * @param {number|null} [excludeCitaId=null] - Opcional: ID de una cita a excluir de la verificación de superposición.
 * @param {object} [transaction=null] - Objeto de transacción de Sequelize.
 * @returns {Promise<Array<Object>>} Un array de objetos { start: string (ISO UTC), end: string (ISO UTC) }
 * @throws {NotFoundError} Si el tipo de atención no se encuentra.
 * @throws {BadRequestError} Si el formato de fecha es inválido.
 */
const _getAvailableSlotsData = async (
  administradorId,
  fecha,
  tipoAtencionId,
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

  const tipoAtencion = await TipoAtencion.findByPk(tipoAtencionId, {
    transaction,
  });
  if (!tipoAtencion) {
    throw new NotFoundError("Tipo de atención no encontrado.");
  }
  const duracionCita = tipoAtencion.duracion_minutos;
  const bufferMinutes = tipoAtencion.buffer_minutos;

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
    include: [
      {
        model: TipoAtencion,
        attributes: ["duracion_minutos", "buffer_minutos"],
      },
    ],
    transaction,
  });

  const bookedBlocks = citasExistentes.map((cita) => {
    const bookedStartUTC = DateTime.fromJSDate(cita.fecha_hora_cita, {
      zone: "utc",
    });
    const bookedEndUTC = bookedStartUTC.plus({
      minutes:
        cita.TipoAtencion.duracion_minutos + cita.TipoAtencion.buffer_minutos,
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

      let isAvailable = true; // 1. Verificar si el slot ha pasado

      if (slotEndUTC <= nowUTC) {
        isAvailable = false;
      } // 2. Verificar solapamiento con excepciones

      if (isAvailable) {
        for (const excepcion of excepciones) {
          if (excepcion.es_dia_completo) {
            isAvailable = false;
            break;
          }

          const bloqueoStartLocal = targetDateLocal.set({
            hour: parseInt(excepcion.hora_inicio_bloqueo.split(":")[0]),
            minute: parseInt(excepcion.hora_inicio_bloqueo.split(":")[1]),
          });
          const bloqueoEndLocal = targetDateLocal.set({
            hour: parseInt(excepcion.hora_fin_bloqueo.split(":")[0]),
            minute: parseInt(excepcion.hora_fin_bloqueo.split(":")[1]),
          });

          if (
            slotEndUTC > bloqueoStartLocal.setZone("utc") &&
            bloqueoEndLocal.setZone("utc") > slotStartUTC
          ) {
            isAvailable = false;
            break;
          }
        }
      } // 3. Verificar solapamiento con citas existentes

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
  } // Ordenar la lista final

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
