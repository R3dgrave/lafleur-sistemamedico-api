// src/controllers/appointment.controller.js
const {
  Cita,
  Paciente,
  TipoAtencion,
  Administrador,
  sequelize,
} = require("../../models/index");
const { createCitaSchema, updateCitaSchema } = require("../utils/validation");
const { Op } = require("sequelize");
const { _getAvailableSlotsData } = require("./availability.controller");
const { DateTime } = require("luxon");
const { NotFoundError, BadRequestError } = require("../utils/customErrors");
const { validate } = require("uuid");
const CHILE_TIMEZONE = "America/Santiago";

/**
 * Valida si una franja horaria específica está disponible.
 * Ahora lanza errores personalizados en lugar de devolver `false`.
 * @param {number} administradorId - ID del administrador.
 * @param {string} requestedDateISO - Fecha solicitada en formato ISO.
 * @param {number} tipoAtencionId - ID del tipo de atención.
 * @param {string} requestedStartISO - Fecha y hora de inicio solicitada en formato ISO (UTC).
 * @param {object} [options] - Opciones adicionales, incluyendo la transacción y la cita a excluir.
 * @returns {Promise<boolean>} - `true` si la franja está disponible.
 */
const validateAppointmentAvailability = async (
  administradorId,
  requestedDateISO,
  tipoAtencionId,
  requestedStartISO,
  options = {}
) => {
  const { excludeCitaId = null, transaction = null } = options;

  const tipoAtencion = await TipoAtencion.findByPk(tipoAtencionId, {
    transaction,
  });
  if (!tipoAtencion) {
    throw new NotFoundError("Tipo de atención no encontrado.");
  }

  const requestedStartDateTimeLocal = DateTime.fromISO(requestedStartISO, {
    zone: "utc",
  })
    .setZone(CHILE_TIMEZONE)
    .startOf("minute");

  const availableSlots = await _getAvailableSlotsData(
    administradorId,
    requestedDateISO,
    tipoAtencionId,
    excludeCitaId,
    transaction
  );

  const isSlotAvailable = availableSlots.some((slot) => {
    const slotStartLocal = DateTime.fromISO(slot.start, { zone: "utc" })
      .setZone(CHILE_TIMEZONE)
      .startOf("minute");
    return requestedStartDateTimeLocal.equals(slotStartLocal);
  });

  return isSlotAvailable;
};

const createCita = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const validatedData = createCitaSchema.parse(req.body);
    const { paciente_id, administrador_id, fecha_hora_cita, tipo_atencion_id } =
      validatedData;

    // Convertimos la fecha de string a un objeto Date de forma explícita.
    const requestedDate = new Date(fecha_hora_cita);

    // Se verifican las entidades relacionadas. Si no existen, se lanza un error.
    const [paciente, administrador, tipoAtencion] = await Promise.all([
      Paciente.findByPk(paciente_id, { transaction: t }),
      Administrador.findByPk(administrador_id, { transaction: t }),
      TipoAtencion.findByPk(tipo_atencion_id, { transaction: t }),
    ]);

    if (!paciente) {
      throw new NotFoundError("Paciente no encontrado.");
    }
    if (!administrador) {
      throw new NotFoundError("Administrador no encontrado.");
    }
    if (!tipoAtencion) {
      throw new NotFoundError("Tipo de atención no encontrado.");
    }

    // Calculamos la hora de fin de la nueva cita.
    const requestedEndTime = new Date(
      requestedDate.getTime() + tipoAtencion.duracion_minutos * 60000
    );

    // --- CONSULTA ÚNICA Y ROBUSTA PARA DETECTAR CUALQUIER TIPO DE CONFLICTO ---
    const conflictingAppointment = await Cita.findOne({
      where: {
        // Excluimos citas canceladas de la validación
        estado_cita: { [Op.ne]: "Cancelada" },
        [Op.or]: [
          // Chequeamos si el paciente ya tiene una cita solapada
          {
            paciente_id,
            [Op.and]: [
              // La cita existente termina después de que la nueva cita comienza
              { fecha_hora_cita: { [Op.lt]: requestedEndTime } },
              // La cita existente comienza antes de que la nueva cita termina
              sequelize.literal(
                `'${requestedDate.toISOString()}' < "Cita"."fecha_hora_cita" + ("TipoAtencion"."duracion_minutos" * INTERVAL '1 minute')`
              ),
            ],
          },
          // Chequeamos si el administrador ya tiene una cita solapada
          {
            administrador_id,
            [Op.and]: [
              // La cita existente termina después de que la nueva cita comienza
              { fecha_hora_cita: { [Op.lt]: requestedEndTime } },
              // La cita existente comienza antes de que la nueva cita termina
              sequelize.literal(
                `'${requestedDate.toISOString()}' < "Cita"."fecha_hora_cita" + ("TipoAtencion"."duracion_minutos" * INTERVAL '1 minute')`
              ),
            ],
          },
        ],
      },
      include: [
        {
          model: TipoAtencion,
          attributes: ["duracion_minutos"],
        },
      ],
      transaction: t,
    });

    if (conflictingAppointment) {
      console.error(
        "Se encontró un conflicto de solapamiento:",
        conflictingAppointment
      );
      // Determinamos el tipo de conflicto para dar un mensaje más específico.
      if (conflictingAppointment.paciente_id === paciente_id) {
        throw new BadRequestError(
          "El paciente ya tiene una cita agendada que se solapa con el horario solicitado."
        );
      } else {
        throw new BadRequestError(
          "El administrador ya tiene una cita agendada que se solapa con el horario solicitado."
        );
      }
    }

    // Si la validación pasa, creamos la cita.
    // Usamos el 'validatedData' original para mantener cualquier otra propiedad
    // que se haya enviado y validado.
    const newCita = await Cita.create(
      { ...validatedData, fecha_hora_cita: requestedDate },
      { transaction: t }
    );

    await t.commit();

    res
      .status(201)
      .json({ message: "Cita creada exitosamente.", cita: newCita });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    next(error);
  }
};

const getAllCitas = async (req, res, next) => {
  try {
    const {
      paciente_id,
      tipo_atencion_id,
      estado_cita,
      fecha_inicio,
      fecha_fin,
    } = req.query;
    const whereClause = {};

    if (paciente_id) whereClause.paciente_id = paciente_id;
    if (tipo_atencion_id) whereClause.tipo_atencion_id = tipo_atencion_id;
    if (estado_cita) whereClause.estado_cita = estado_cita;

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_hora_cita = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    } else if (fecha_inicio) {
      whereClause.fecha_hora_cita = {
        [Op.gte]: new Date(fecha_inicio),
      };
    } else if (fecha_fin) {
      whereClause.fecha_hora_cita = {
        [Op.lte]: new Date(fecha_fin),
      };
    }

    const citas = await Cita.findAll({
      where: whereClause,
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
    res.status(200).json(citas);
  } catch (error) {
    next(error);
  }
};

const getCitasByPacienteRut = async (req, res, next) => {
  try {
    const { rut } = req.params;

    const paciente = await Paciente.findOne({ where: { rut: rut } });
    if (!paciente) {
      throw new NotFoundError(
        "Paciente no encontrado con el RUT proporcionado."
      );
    }
    const paciente_id = paciente.paciente_id;

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

    if (citas.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(citas);
  } catch (error) {
    next(error);
  }
};

const updateCita = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const validatedData = updateCitaSchema.parse(req.body);

    const cita = await Cita.findByPk(id, {
      include: [
        {
          model: TipoAtencion,
          attributes: ["duracion_minutos", "buffer_minutos"],
        },
      ],
      transaction: t,
    });
    if (!cita) {
      throw new NotFoundError("Cita no encontrada.");
    }

    const checks = [
      {
        id: validatedData.paciente_id,
        currentId: cita.paciente_id,
        Model: Paciente,
        name: "Paciente",
        path: "paciente_id",
      },
      {
        id: validatedData.administrador_id,
        currentId: cita.administrador_id,
        Model: Administrador,
        name: "Administrador",
        path: "administrador_id",
      },
      {
        id: validatedData.tipo_atencion_id,
        currentId: cita.tipo_atencion_id,
        Model: TipoAtencion,
        name: "Tipo de atención",
        path: "tipo_atencion_id",
      },
    ];

    // Lógica de errores para devolver un array detallado de errores, para el middleware.
    const errors = [];
    for (const check of checks) {
      if (check.id && check.id !== check.currentId) {
        const entity = await check.Model.findByPk(check.id, { transaction: t });
        if (!entity) {
          errors.push({
            path: [check.path],
            message: `Nuevo ${check.name} asociado no encontrado.`,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError(
        "Errores al verificar entidades relacionadas para la actualización.",
        errors
      );
    }

    const hasAvailabilityChanged =
      validatedData.fecha_hora_cita ||
      validatedData.tipo_atencion_id ||
      validatedData.administrador_id;

    if (hasAvailabilityChanged) {
      const currentTipoAtencionId =
        validatedData.tipo_atencion_id || cita.tipo_atencion_id;
      const currentAdministradorId =
        validatedData.administrador_id || cita.administrador_id;
      const currentFechaHoraCita = validatedData.fecha_hora_cita
        ? new Date(validatedData.fecha_hora_cita)
        : new Date(cita.fecha_hora_cita);

      const tipoAtencionParaValidacion = await TipoAtencion.findByPk(
        currentTipoAtencionId,
        { transaction: t }
      );
      if (!currentAdministradorId || !tipoAtencionParaValidacion) {
        throw new BadRequestError(
          "Administrador y/o Tipo de Atención son requeridos para validar la disponibilidad."
        );
      }

      const requestedDateISO = DateTime.fromJSDate(currentFechaHoraCita, {
        zone: "utc",
      })
        .setZone(CHILE_TIMEZONE)
        .toISODate();

      const isAvailable = await validateAppointmentAvailability(
        currentAdministradorId,
        requestedDateISO,
        currentTipoAtencionId,
        currentFechaHoraCita.toISOString(),
        { excludeCitaId: id, transaction: t }
      );

      if (!isAvailable) {
        throw new BadRequestError(
          "La franja horaria solicitada no está disponible o se superpone con otra cita/excepción."
        );
      }
    }

    await cita.update(validatedData, { transaction: t });
    await t.commit();

    res.status(200).json({
      message: "Cita actualizada exitosamente",
      cita: cita,
    });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    next(error);
  }
};

const deleteCita = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const result = await Cita.destroy({
      where: { cita_id: id },
      transaction: t,
    });

    if (result === 0) {
      throw new NotFoundError("Cita no encontrada.");
    }

    await t.commit();

    res.status(200).json({ message: "Cita eliminada exitosamente." });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    next(error);
  }
};

module.exports = {
  createCita,
  getAllCitas,
  updateCita,
  deleteCita,
  getCitasByPacienteRut,
};
