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
 * @param {number} administradorId - ID del administrador.
 * @param {string} requestedDateISO - Fecha solicitada en formato ISO ('YYYY-MM-DD').
 * @param {string} requestedStartISO - Fecha y hora de inicio solicitada en formato ISO (UTC).
 * @param {object} [options] - Opciones adicionales, incluyendo la transacción y la cita a excluir.
 * @returns {Promise<boolean>} - `true` si la franja está disponible.
 */
const validateAppointmentAvailability = async (
  administradorId,
  requestedDateISO,
  requestedStartISO,
  options = {}
) => {
  const { excludeCitaId = null, transaction = null } = options;

  // La función _getAvailableSlotsData ahora usa `requestedDateISO` directamente
  // y la duración es fija, por lo que no se necesita el tipoAtencionId.
  const availableSlots = await _getAvailableSlotsData(
    administradorId,
    requestedDateISO,
    excludeCitaId,
    transaction
  );

  const isSlotAvailable = availableSlots.some((slot) => {
    const slotStartUTC = DateTime.fromISO(slot.start, {
      zone: "utc",
    }).startOf("minute");
    const requestedStartDateTimeUTC = DateTime.fromISO(requestedStartISO, {
      zone: "utc",
    }).startOf("minute");
    return requestedStartDateTimeUTC.equals(slotStartUTC);
  });

  return isSlotAvailable;
};

const createCita = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const validatedData = createCitaSchema.parse(req.body);
    const { paciente_id, administrador_id, fecha_hora_cita, tipo_atencion_id } =
      validatedData;

    // Usa new Date() para parsear el string de la fecha,
    // y luego Luxon.fromJSDate para crear un objeto Luxon robusto.
    const requestedStartDateTime = DateTime.fromJSDate(new Date(fecha_hora_cita));

    if (!requestedStartDateTime.isValid) {
      throw new BadRequestError("Formato de fecha de solicitud inválido.");
    }
    
    const requestedDateISO = requestedStartDateTime.toISODate();
    const requestedStartISO = requestedStartDateTime.toISO();

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
    
    const isSlotAvailable = await validateAppointmentAvailability(
      administrador_id,
      requestedDateISO,
      requestedStartISO,
      { transaction: t }
    );
    
    if (!isSlotAvailable) {
      throw new BadRequestError(
        "La franja horaria solicitada no está disponible o se solapa con otra cita/excepción."
      );
    }

    const newCita = await Cita.create(
      { ...validatedData, fecha_hora_cita: new Date(fecha_hora_cita) },
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
        {
          model: TipoAtencion,
          attributes: ["nombre_atencion", "duracion_minutos", "buffer_minutos"],
        },
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

    const cita = await Cita.findByPk(id, { transaction: t });
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
      const currentTipoAtencionId = validatedData.tipo_atencion_id || cita.tipo_atencion_id;
      const currentAdministradorId = validatedData.administrador_id || cita.administrador_id;
      const currentFechaHoraCita = validatedData.fecha_hora_cita
        ? new Date(validatedData.fecha_hora_cita)
        : new Date(cita.fecha_hora_cita);

      // Usa DateTime.fromJSDate para parsear el objeto de fecha JS a Luxon
      const requestedStartDateTime = DateTime.fromJSDate(currentFechaHoraCita);

      const requestedDateISO = requestedStartDateTime.toISODate();
      const requestedStartISO = requestedStartDateTime.toISO();

      const isAvailable = await validateAppointmentAvailability(
        currentAdministradorId,
        requestedDateISO,
        requestedStartISO,
        { excludeCitaId: id, transaction: t }
      );

      if (!isAvailable) {
        throw new BadRequestError(
          "La franja horaria solicitada no está disponible o se solapa con otra cita/excepción."
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
