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

const { DateTime, Settings } = require("luxon");
const CHILE_TIMEZONE = "America/Santiago"; // Define la zona horaria de Chile para consistencia.

/**
 * Genera una lista de franjas horarias potenciales basadas en un rango de tiempo,
 * la duración de la cita y el tiempo de buffer.
 * Cada franja incluye la hora de inicio y fin de la cita reservable,
 * y considera el buffer para la siguiente franja.
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
  // Inicializa el tiempo actual al inicio del horario disponible, con precisión de minuto.
  let currentTime = startDateTimeLocal.startOf("minute");

  // Itera para generar franjas hasta que no quepan más.
  while (true) {
    // Calcula el final potencial de la cita (solo la duración reservable).
    const potentialSlotEnd = currentTime.plus({ minutes: durationMinutes });
    // Calcula el final del bloque total (cita + buffer). Este es el punto de inicio de la siguiente franja.
    const totalSlotBlockEnd = potentialSlotEnd.plus({ minutes: bufferMinutes });

    // Si el bloque total (cita + buffer) excede el horario disponible, no se pueden añadir más franjas completas.
    if (totalSlotBlockEnd > endDateTimeLocal) {
      break;
    }

    // Añade la franja al array (solo la duración reservable, convertida a UTC ISO).
    slots.push({
      start: currentTime.setZone("utc").toISO(),
      end: potentialSlotEnd.setZone("utc").toISO(),
    });

    // Mueve el tiempo actual al final del bloque total para la siguiente iteración.
    currentTime = totalSlotBlockEnd;
  }
  return slots;
};

/**
 * Crea un nuevo horario disponible para un administrador.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const createHorarioDisponible = async (req, res, next) => {
  try {
    // Valida los datos de entrada usando el esquema Zod.
    const validatedData = horarioDisponibleSchema.parse(req.body);
    // Crea el nuevo horario disponible en la base de datos.
    const newHorario = await HorarioDisponible.create(validatedData);
    res
      .status(201)
      .json({ message: "Horario disponible creado.", horario: newHorario });
  } catch (error) {
    // Manejo específico para errores de unicidad de Sequelize.
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Este horario ya existe para este día y administrador.",
      });
    }
    // Pasa cualquier otro error al siguiente middleware de errores.
    next(error);
  }
};

/**
 * Obtiene todos los horarios disponibles registrados.
 * Incluye información básica del administrador asociado.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAllHorariosDisponibles = async (req, res, next) => {
  try {
    // Busca todos los horarios disponibles, incluyendo el nombre y apellido del administrador.
    const horarios = await HorarioDisponible.findAll({
      include: [{ model: Administrador, attributes: ["nombre", "apellido"] }],
      order: [
        ["administrador_id", "ASC"], // Ordena por administrador.
        ["dia_semana", "ASC"], // Luego por día de la semana.
        ["hora_inicio", "ASC"], // Finalmente por hora de inicio.
      ],
    });
    res.status(200).json(horarios);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
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
    // Valida los datos de entrada usando el esquema Zod.
    const validatedData = excepcionDisponibilidadSchema.parse(req.body);
    // Crea la nueva excepción en la base de datos.
    const newExcepcion = await ExcepcionDisponibilidad.create(validatedData);
    res.status(201).json({
      message: "Excepción de disponibilidad creada.",
      excepcion: newExcepcion,
    });
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

/**
 * Obtiene todas las excepciones de disponibilidad registradas.
 * Incluye información básica del administrador asociado.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAllExcepcionesDisponibilidad = async (req, res, next) => {
  try {
    // Busca todas las excepciones de disponibilidad, incluyendo el nombre y apellido del administrador.
    const excepciones = await ExcepcionDisponibilidad.findAll({
      include: [{ model: Administrador, attributes: ["nombre", "apellido"] }],
      order: [["fecha", "ASC"]], // Ordena por fecha.
    });
    res.status(200).json(excepciones);
  } catch (error) {
    next(error); // Pasa cualquier error al siguiente middleware.
  }
};

/**
 * Función auxiliar para obtener las franjas horarias disponibles para un administrador en una fecha específica,
 * considerando horarios base, citas existentes y excepciones de disponibilidad.
 * @param {number} administradorId - ID del administrador.
 * @param {string} fecha - Fecha en formato 'YYYY-MM-DD' (se asume en la zona horaria de Chile).
 * @param {number} tipoAtencionId - ID del tipo de atención para determinar la duración y el buffer de la cita.
 * @param {number|null} [excludeCitaId=null] - Opcional: ID de una cita a excluir de la verificación de superposición.
 * Útil para la lógica de actualización de citas.
 * @returns {Promise<Array<Object>>} Un array de objetos { start: string (ISO UTC), end: string (ISO UTC) }
 * representando las franjas horarias disponibles.
 * @throws {Error} Si el formato de fecha es inválido o el tipo de atención no se encuentra.
 */
const _getAvailableSlotsData = async (
  administradorId,
  fecha, // Se espera 'YYYY-MM-DD' en la zona horaria de Chile.
  tipoAtencionId,
  excludeCitaId = null
) => {
  // Configura Luxon para usar la zona horaria de Chile.
  Settings.defaultZone = CHILE_TIMEZONE;

  // Parsea la fecha objetivo en la zona horaria de Chile y la establece al inicio del día.
  const targetDateLocal = DateTime.fromISO(fecha).startOf("day");
  if (!targetDateLocal.isValid) {
    throw new Error("Formato de fecha inválido.");
  }
  const dayOfWeek = targetDateLocal.weekday; // Obtiene el día de la semana (1=Lunes, 7=Domingo según Luxon).

  // Obtiene la duración y el buffer del tipo de atención.
  const tipoAtencion = await TipoAtencion.findByPk(tipoAtencionId);
  if (!tipoAtencion) {
    throw new Error("Tipo de atención no encontrado.");
  }
  const duracionCita = tipoAtencion.duracion_minutos;
  const bufferMinutes = tipoAtencion.buffer_minutos || 0;

  // 1. Obtener horarios base del administrador para el día de la semana.
  const horariosBase = await HorarioDisponible.findAll({
    where: { administrador_id: administradorId, dia_semana: dayOfWeek },
  });

  if (horariosBase.length === 0) {
    return []; // Si no hay horarios base, no hay franjas disponibles.
  }

  // 2. Generar todas las franjas potenciales basadas en los horarios base.
  let franjasPotenciales = [];
  for (const horario of horariosBase) {
    // Convierte las horas de inicio y fin del horario base a objetos DateTime locales.
    const startDateTimeLocal = targetDateLocal.set({
      hour: parseInt(horario.hora_inicio.split(":")[0]),
      minute: parseInt(horario.hora_inicio.split(":")[1]),
    });
    const endDateTimeLocal = targetDateLocal.set({
      hour: parseInt(horario.hora_fin.split(":")[0]),
      minute: parseInt(horario.hora_fin.split(":")[1]),
    });

    // Concatena las franjas generadas para este horario base.
    franjasPotenciales = franjasPotenciales.concat(
      generateTimeSlots(
        startDateTimeLocal,
        endDateTimeLocal,
        duracionCita,
        bufferMinutes
      )
    );
  }

  // 3. Obtener citas existentes para el administrador en la fecha objetivo.
  const whereCitasClause = {
    administrador_id: administradorId,
    // Filtra las citas que caen dentro del día objetivo (de inicio a fin del día UTC).
    fecha_hora_cita: {
      [Op.gte]: targetDateLocal.startOf("day").setZone("utc").toJSDate(),
      [Op.lt]: targetDateLocal.endOf("day").setZone("utc").toJSDate(),
    },
    estado_cita: { [Op.notIn]: ["Cancelada"] }, // Solo considera citas que no estén canceladas.
  };

  // Si se proporciona un `excludeCitaId`, se excluye esa cita de la consulta.
  // Esto es crucial para que al actualizar una cita, no se considere a sí misma como una superposición.
  if (excludeCitaId) {
    whereCitasClause.cita_id = { [Op.ne]: excludeCitaId }; // Op.ne significa "no igual a".
  }

  const citasExistentes = await Cita.findAll({
    where: whereCitasClause,
    include: [
      {
        model: TipoAtencion, // Incluye el TipoAtencion para obtener su duración y buffer.
        attributes: ["duracion_minutos", "buffer_minutos"],
      },
    ],
  });

  // Calcula los bloques ocupados por las citas existentes (inicio a fin + buffer) en UTC.
  const bookedBlocks = citasExistentes.map((cita) => {
    const bookedStartUTC = DateTime.fromJSDate(cita.fecha_hora_cita, {
      zone: "utc",
    });
    const bookedDuration = cita.TipoAtencion
      ? cita.TipoAtencion.duracion_minutos
      : 0;
    const bookedBuffer = cita.TipoAtencion
      ? cita.TipoAtencion.buffer_minutos || 0
      : 0;

    const bookedEndUTC = bookedStartUTC.plus({
      minutes: bookedDuration + bookedBuffer,
    });
    return { start: bookedStartUTC, end: bookedEndUTC };
  });

  // 4. Obtener excepciones de disponibilidad para la fecha objetivo.
  const excepciones = await ExcepcionDisponibilidad.findAll({
    where: { administrador_id: administradorId, fecha: fecha }, // 'fecha' aquí es YYYY-MM-DD.
  });

  // 5. Filtrar las franjas potenciales.
  let franjasDisponibles = franjasPotenciales.filter((slot) => {
    const slotStartUTC = DateTime.fromISO(slot.start, { zone: "utc" });
    const slotEndUTC = DateTime.fromISO(slot.end, { zone: "utc" }); // Fin de la duración reservable.
    // Calcula el final del bloque total de la franja potencial (incluyendo su propio buffer).
    const slotTotalBlockEndUTC = slotEndUTC.plus({ minutes: bufferMinutes });

    // a. Filtrar franjas que ya pasaron (basado en la hora actual UTC).
    const nowUTC = DateTime.now().setZone("utc");
    if (slotTotalBlockEndUTC <= nowUTC) {
      return false; // Si el bloque de la franja ya terminó, no está disponible.
    }

    // b. Verificar superposiciones con excepciones.
    for (const excepcion of excepciones) {
      if (excepcion.es_dia_completo) {
        return false; // Si hay una excepción de día completo, ninguna franja es disponible.
      }

      // Convierte las horas de inicio y fin de la excepción a objetos DateTime locales y luego a UTC.
      const excepcionStartLocal = targetDateLocal.set({
        hour: parseInt(excepcion.hora_inicio_bloqueo.split(":")[0]),
        minute: parseInt(excepcion.hora_inicio_bloqueo.split(":")[1]),
      });
      const excepcionEndLocal = targetDateLocal.set({
        hour: parseInt(excepcion.hora_fin_bloqueo.split(":")[0]),
        minute: parseInt(excepcion.hora_fin_bloqueo.split(":")[1]),
      });

      const excepcionStartUTC = excepcionStartLocal.setZone("utc");
      const excepcionEndUTC = excepcionEndLocal.setZone("utc");

      // Lógica de superposición: [start1, end1) y [start2, end2) se superponen si (end1 > start2 && end2 > start1)
      if (
        slotTotalBlockEndUTC > excepcionStartUTC && // El final del slot (con buffer) está después del inicio de la excepción
        excepcionEndUTC > slotStartUTC // El final de la excepción está después del inicio del slot
      ) {
        return false; // Hay una superposición con una excepción, la franja no está disponible.
      }
    }

    // c. Verificar superposiciones con citas existentes (incluyendo su buffer).
    for (const booked of bookedBlocks) {
      // booked.start y booked.end ya incluyen el buffer de la cita existente y están en UTC.
      if (
        slotTotalBlockEndUTC > booked.start && // El final del slot (con buffer) está después del inicio de la cita existente
        booked.end > slotStartUTC // El final de la cita existente está después del inicio del slot
      ) {
        return false; // Hay una superposición con una cita existente, la franja no está disponible.
      }
    }
    return true; // Si pasa todas las verificaciones, la franja está disponible.
  });

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
    // Valida que los parámetros esenciales estén presentes.
    if (!administradorId || !fecha || !tipoAtencionId) {
      return res.status(400).json({
        message: "Administrador, fecha y tipo de atención son requeridos.",
      });
    }

    // Llama a la función auxiliar para obtener las franjas disponibles.
    const franjas = await _getAvailableSlotsData(
      parseInt(administradorId),
      fecha,
      parseInt(tipoAtencionId),
      excludeCitaId ? parseInt(excludeCitaId) : null // Pasa excludeCitaId si está presente.
    );

    // El frontend espera un array de objetos {start, end} en formato ISO UTC,
    // o un array de strings con solo la hora formateada.
    // La línea `res.status(200).json(franjas);` envía el formato {start: ISO, end: ISO}.
    // La línea comentada `res.status(200).json(formattedFranjas);` enviaría solo las horas.
    // Mantengo la que envía el objeto completo ya que es más útil para el frontend.
    res.status(200).json(franjas);
    // const formattedFranjas = franjas.map((slot) => {
    //   return DateTime.fromISO(slot.start, { zone: "utc" })
    //     .setZone(CHILE_TIMEZONE)
    //     .toFormat("HH:mm");
    // });
    // res.status(200).json(formattedFranjas);
  } catch (error) {
    // Manejo de errores específicos para la función _getAvailableSlotsData.
    if (error.message.includes("Tipo de atención no encontrado")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Formato de fecha inválido")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error en getFranjasDisponibles:", error); // Log para errores inesperados.
    next(error); // Pasa cualquier otro error al siguiente middleware.
  }
};

module.exports = {
  createHorarioDisponible,
  getAllHorariosDisponibles,
  createExcepcionDisponibilidad,
  getAllExcepcionesDisponibilidad,
  getFranjasDisponibles,
  _getAvailableSlotsData, // Exportado para que appointment.controller.js pueda usarlo directamente.
  generateTimeSlots, // Exportado si otras partes del sistema necesitan generar franjas.
};
