// src/controllers/clinical-history.controller.js
const db = require("../../models/index");
const {
  HistoriaClinica,
  Anamnesis,
  Paciente,
  Cita,
  ExploracionFisica,
  Diagnostico,
  PlanTratamiento,
  PruebasIniciales,
} = db;
const { Op } = require("sequelize");
const {
  createHistoriaClinicaSchema,
  createAnamnesisSchema,
  updateAnamnesisSchema,
  createExploracionFisicaSchema,
  updateExploracionFisicaSchema,
  createDiagnosticoSchema,
  updateDiagnosticoSchema,
  createPlanTratamientoSchema,
  updatePlanTratamientoSchema,
  createPruebasInicialesSchema,
  updatePruebasInicialesSchema,
} = require("../utils/validation");

const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../utils/customErrors");

/**
 * Clase genérica para un manejador de controlador.
 * Ahora lanza un NotFoundError si el registro no se encuentra.
 */
class BaseController {
  constructor(Model, modelName) {
    this.Model = Model;
    this.modelName = modelName;
  }

  async findById(id) {
    const record = await this.Model.findByPk(id);
    if (!record) {
      throw new NotFoundError(`${this.modelName} no encontrado.`);
    }
    return record;
  }
}

/**
 * Controlador principal para manejar la Historia Clínica y sus sub-secciones.
 */
class ClinicalHistoryController {
  constructor() {
    this.anamnesis = new BaseController(Anamnesis, "Anamnesis");
    this.exploracionFisica = new BaseController(
      ExploracionFisica,
      "Exploración física"
    );
    this.diagnostico = new BaseController(Diagnostico, "Diagnóstico");
    this.planTratamiento = new BaseController(
      PlanTratamiento,
      "Plan de tratamiento"
    );
    this.PruebasIniciales = new BaseController(
      PruebasIniciales,
      "Pruebas iniciales"
    );
  }

  // --- Métodos de la Historia Clínica ---

  async createHistoriaClinica(req, res, next) {
    try {
      const validatedData = createHistoriaClinicaSchema.parse(req.body);
      const { paciente_id } = validatedData;

      const existingHistoria = await HistoriaClinica.findOne({
        where: { paciente_id },
      });
      if (existingHistoria) {
        throw new ConflictError(
          "Ya existe una historia clínica para este paciente."
        );
      }

      const paciente = await Paciente.findByPk(paciente_id);
      if (!paciente) {
        throw new NotFoundError("Paciente no encontrado.");
      }

      const newHistoriaClinica = await HistoriaClinica.create({ paciente_id });

      res.status(201).json({
        message: "Historia clínica creada exitosamente.",
        historiaClinica: newHistoriaClinica,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async getHistoriaClinicaByPacienteId(req, res, next) {
    try {
      const { pacienteId } = req.params;
      const historiaClinica = await HistoriaClinica.findOne({
        where: { paciente_id: pacienteId },
        include: [
          {
            model: Paciente,
            as: "Paciente",
            attributes: ["paciente_id", "nombre", "apellido", "rut", "email"],
          },
        ],
      });

      if (!historiaClinica) {
        throw new NotFoundError(
          `Historia clínica no encontrada para el paciente con ID ${pacienteId}.`
        );
      }
      res.status(200).json(historiaClinica);
    } catch (error) {
      next(error);
    }
  }

  async getHistoriaClinicaByPacienteRut(req, res, next) {
    try {
      const { rut } = req.params;
      const paciente = await Paciente.findOne({ where: { rut } });

      if (!paciente) {
        throw new NotFoundError(
          "Paciente no encontrado con el RUT proporcionado."
        );
      }

      const historiaClinica = await HistoriaClinica.findOne({
        where: { paciente_id: paciente.paciente_id },
        include: [
          {
            model: Paciente,
            as: "Paciente",
            attributes: ["paciente_id", "nombre", "apellido", "rut", "email"],
          },
        ],
      });

      if (!historiaClinica) {
        throw new NotFoundError(
          `Historia clínica no encontrada para el paciente con RUT ${rut}.`
        );
      }
      res.status(200).json(historiaClinica);
    } catch (error) {
      next(error);
    }
  }

  // --- Métodos de Anamnesis ---

  async createAnamnesis(req, res, next) {
    try {
      const { historiaClinicaId } = req.params;
      const validatedData = createAnamnesisSchema.parse({
        ...req.body,
        historia_clinica_id: parseInt(historiaClinicaId),
      });

      await new BaseController(HistoriaClinica, "Historia clínica").findById(
        validatedData.historia_clinica_id
      );
      if (validatedData.cita_id) {
        const cita = await Cita.findByPk(validatedData.cita_id);
        if (!cita) {
          throw new NotFoundError("Cita asociada no encontrada.");
        }
      }

      const newAnamnesis = await Anamnesis.create(validatedData);

      res.status(201).json({
        message: "Anamnesis registrada exitosamente.",
        anamnesis: newAnamnesis,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async getAnamnesisByHistoriaClinicaId(req, res, next) {
    try {
      const { historiaClinicaId } = req.params;
      await new BaseController(HistoriaClinica, "Historia clínica").findById(
        historiaClinicaId
      );
      const anamnesisRecords = await Anamnesis.findAll({
        where: { historia_clinica_id: historiaClinicaId },
        include: [
          {
            model: Cita,
            as: "Cita",
            attributes: ["cita_id", "fecha_hora_cita"],
          },
        ],
        order: [["fecha_registro", "DESC"]],
      });
      res.status(200).json(anamnesisRecords);
    } catch (error) {
      next(error);
    }
  }

  async updateAnamnesis(req, res, next) {
    try {
      const { anamnesisId } = req.params;
      const validatedData = updateAnamnesisSchema.parse(req.body);

      const anamnesis = await this.anamnesis.findById(anamnesisId);
      await anamnesis.update(validatedData);

      res.status(200).json({
        message: "Anamnesis actualizada exitosamente.",
        anamnesis: anamnesis,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async deleteAnamnesis(req, res, next) {
    try {
      const { anamnesisId } = req.params;
      const result = await Anamnesis.destroy({
        where: { anamnesis_id: anamnesisId },
      });
      if (result === 0) {
        throw new NotFoundError("Anamnesis no encontrada.");
      }
      res.status(200).json({ message: "Anamnesis eliminada exitosamente." });
    } catch (error) {
      next(error);
    }
  }

  // --- Métodos de Exploración Física ---

  async createExploracionFisica(req, res, next) {
    try {
      const { historiaClinicaId } = req.params;
      const validatedData = createExploracionFisicaSchema.parse({
        ...req.body,
        historia_clinica_id: parseInt(historiaClinicaId),
      });

      await new BaseController(HistoriaClinica, "Historia clínica").findById(
        validatedData.historia_clinica_id
      );
      if (validatedData.cita_id) {
        const cita = await Cita.findByPk(validatedData.cita_id);
        if (!cita) {
          throw new NotFoundError("Cita asociada no encontrada.");
        }
      }

      const newExploracionFisica = await ExploracionFisica.create(
        validatedData
      );

      res.status(201).json({
        message: "Exploración física registrada exitosamente.",
        exploracionFisica: newExploracionFisica,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async getExploracionFisicaByHistoriaClinicaId(req, res, next) {
    try {
      const { historiaClinicaId } = req.params;
      await new BaseController(HistoriaClinica, "Historia clínica").findById(
        historiaClinicaId
      );
      const exploracionRecords = await ExploracionFisica.findAll({
        where: { historia_clinica_id: historiaClinicaId },
        include: [
          {
            model: Cita,
            as: "Cita",
            attributes: ["cita_id", "fecha_hora_cita"],
          },
        ],
        order: [["fecha_registro", "DESC"]],
      });
      res.status(200).json(exploracionRecords);
    } catch (error) {
      next(error);
    }
  }

  async updateExploracionFisica(req, res, next) {
    try {
      const { exploracionId } = req.params;
      const validatedData = updateExploracionFisicaSchema.parse(req.body);

      const exploracion = await this.exploracionFisica.findById(exploracionId);
      await exploracion.update(validatedData);

      res.status(200).json({
        message: "Exploración física actualizada exitosamente.",
        exploracionFisica: exploracion,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async deleteExploracionFisica(req, res, next) {
    try {
      const { exploracionId } = req.params;
      const result = await ExploracionFisica.destroy({
        where: { exploracion_id: exploracionId },
      });
      if (result === 0) {
        throw new NotFoundError("Exploración física no encontrada.");
      }
      res
        .status(200)
        .json({ message: "Exploración física eliminada exitosamente." });
    } catch (error) {
      next(error);
    }
  }

  // --- Métodos de Diagnóstico ---

  async createDiagnostico(req, res, next) {
    try {
      const { historiaClinicaId } = req.params;
      const validatedData = createDiagnosticoSchema.parse({
        ...req.body,
        historia_clinica_id: parseInt(historiaClinicaId),
      });

      await new BaseController(HistoriaClinica, "Historia clínica").findById(
        validatedData.historia_clinica_id
      );
      if (validatedData.cita_id) {
        const cita = await Cita.findByPk(validatedData.cita_id);
        if (!cita) {
          throw new NotFoundError("Cita asociada no encontrada.");
        }
      }

      const newDiagnostico = await Diagnostico.create(validatedData);

      res.status(201).json({
        message: "Diagnóstico registrado exitosamente.",
        diagnostico: newDiagnostico,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async getDiagnosticosByHistoriaClinicaId(req, res, next) {
    try {
      const { historiaClinicaId } = req.params;
      await new BaseController(HistoriaClinica, "Historia clínica").findById(
        historiaClinicaId
      );
      const diagnosticoRecords = await Diagnostico.findAll({
        where: { historia_clinica_id: historiaClinicaId },
        include: [
          {
            model: Cita,
            as: "Cita",
            attributes: ["cita_id", "fecha_hora_cita"],
          },
        ],
        order: [["fecha_registro", "DESC"]],
      });
      res.status(200).json(diagnosticoRecords);
    } catch (error) {
      next(error);
    }
  }

  async updateDiagnostico(req, res, next) {
    try {
      const { diagnosticoId } = req.params;
      const validatedData = updateDiagnosticoSchema.parse(req.body);

      const diagnostico = await this.diagnostico.findById(diagnosticoId);
      await diagnostico.update(validatedData);

      res.status(200).json({
        message: "Diagnóstico actualizado exitosamente.",
        diagnostico: diagnostico,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async deleteDiagnostico(req, res, next) {
    try {
      const { diagnosticoId } = req.params;
      const result = await Diagnostico.destroy({
        where: { diagnostico_id: diagnosticoId },
      });
      if (result === 0) {
        throw new NotFoundError("Diagnóstico no encontrado.");
      }
      res.status(200).json({ message: "Diagnóstico eliminado exitosamente." });
    } catch (error) {
      next(error);
    }
  }

  // --- Métodos de Plan de Tratamiento ---

  async createPlanTratamiento(req, res, next) {
    try {
      const { historiaClinicaId } = req.params;
      const validatedData = createPlanTratamientoSchema.parse({
        ...req.body,
        historia_clinica_id: parseInt(historiaClinicaId),
      });

      await new BaseController(HistoriaClinica, "Historia clínica").findById(
        validatedData.historia_clinica_id
      );
      if (validatedData.cita_id) {
        const cita = await Cita.findByPk(validatedData.cita_id);
        if (!cita) {
          throw new NotFoundError("Cita asociada no encontrada.");
        }
      }

      const newPlanTratamiento = await PlanTratamiento.create(validatedData);

      res.status(201).json({
        message: "Plan de tratamiento registrado exitosamente.",
        planTratamiento: newPlanTratamiento,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async getPlanesTratamientoByHistoriaClinica(req, res, next) {
    try {
      const { historiaClinicaId } = req.params;
      await new BaseController(HistoriaClinica, "Historia clínica").findById(
        historiaClinicaId
      );
      const planesTratamiento = await PlanTratamiento.findAll({
        where: { historia_clinica_id: historiaClinicaId },
        include: [
          {
            model: Cita,
            as: "Cita",
            attributes: ["cita_id", "fecha_hora_cita"],
          },
        ],
        order: [["fecha_registro", "DESC"]],
      });
      res.status(200).json(planesTratamiento);
    } catch (error) {
      next(error);
    }
  }

  async getPlanTratamientoById(req, res, next) {
    try {
      const { planId } = req.params;
      const planTratamiento = await this.planTratamiento.findById(planId);
      res.status(200).json(planTratamiento);
    } catch (error) {
      next(error);
    }
  }

  async updatePlanTratamiento(req, res, next) {
    try {
      const { planId } = req.params;
      const validatedData = updatePlanTratamientoSchema.parse(req.body);

      const planTratamiento = await this.planTratamiento.findById(planId);

      if (validatedData.cita_id) {
        const cita = await Cita.findByPk(validatedData.cita_id);
        if (!cita) {
          throw new NotFoundError("Cita asociada no encontrada.");
        }
      }
      await planTratamiento.update(validatedData);

      res.status(200).json({
        message: "Plan de tratamiento actualizado exitosamente.",
        planTratamiento: planTratamiento,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async deletePlanTratamiento(req, res, next) {
    try {
      const { planId } = req.params;

      const result = await PlanTratamiento.destroy({
        where: { plan_tratamiento_id: planId },
      });
      if (result === 0) {
        throw new NotFoundError("Plan de tratamiento no encontrado.");
      }
      res
        .status(200)
        .json({ message: "Plan de tratamiento eliminado exitosamente." });
    } catch (error) {
      next(error);
    }
  }

  // --- Métodos de Pruebas Iniciales ---
  async createPruebasIniciales(req, res, next) {
    try {
      const validatedData = createPruebasInicialesSchema.parse(req.body);
      const historiaClinica = await HistoriaClinica.findByPk(
        validatedData.historia_clinica_id
      );
      if (!historiaClinica) {
        throw new NotFoundError("Historia Clínica no encontrada.");
      }
      const nuevaPrueba = await PruebasIniciales.create(validatedData);
      res.status(201).json(nuevaPrueba);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ValidationError("Error de validación", error.errors));
      }
      next(error);
    }
  }

  async getPruebasInicialesByPacienteId(req, res, next) {
    try {
      const { pacienteId } = req.params;

      // Primero, encontramos la Historia Clínica del paciente para poder hacer la búsqueda.
      const historiaClinica = await HistoriaClinica.findOne({
        where: { paciente_id: pacienteId },
      });

      if (!historiaClinica) {
        // Si el paciente no tiene Historia Clínica, devolvemos un array vacío y un mensaje claro.
        return res.status(200).json({
          message:
            "No se encontraron registros de pruebas iniciales para este paciente.",
          data: [],
        });
      }

      const pruebas = await PruebasIniciales.findAll({
        where: { historia_clinica_id: historiaClinica.historia_clinica_id },
        include: [
          {
            model: HistoriaClinica,
            as: "HistoriaClinica",
            attributes: ["historia_clinica_id"],
          },
          {
            model: Cita,
            as: "Cita",
            attributes: ["cita_id", "fecha_hora_cita"],
          },
        ],
        order: [["fecha_registro", "DESC"]],
      });

      if (!pruebas || pruebas.length === 0) {
        return res.status(200).json({
          message:
            "No se encontraron registros de pruebas iniciales para este paciente.",
          data: [],
        });
      }

      res.status(200).json(pruebas);
    } catch (error) {
      next(error);
    }
  }

  async updatePruebasIniciales(req, res, next) {
    try {
      const { pruebaId } = req.params;
      const validatedData = updatePruebasInicialesSchema.parse(req.body);

      const [updated] = await PruebasIniciales.update(validatedData, {
        where: { prueba_id: pruebaId },
      });

      if (updated) {
        const updatedPrueba = await PruebasIniciales.findByPk(pruebaId);
        return res.status(200).json({
          message: "Prueba inicial actualizada con éxito.",
          data: updatedPrueba,
        });
      }

      throw new NotFoundError("Prueba inicial no encontrada para actualizar.");
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new ValidationError(
            "Error de validación en los datos de la prueba inicial.",
            error.errors
          )
        );
      }
      next(error);
    }
  }

  async deletePruebasIniciales(req, res, next) {
    try {
      const { pruebaId } = req.params;
      const deleted = await PruebasIniciales.destroy({
        where: { prueba_id: pruebaId },
      });

      if (deleted) {
        return res.status(200).json({
          message: "Prueba inicial eliminada con éxito.",
        });
      }

      throw new NotFoundError("Prueba inicial no encontrada para eliminar.");
    } catch (error) {
      next(error);
    }
  }
}

const controller = new ClinicalHistoryController();

module.exports = {
  createHistoriaClinica: controller.createHistoriaClinica,
  getHistoriaClinicaByPacienteId: controller.getHistoriaClinicaByPacienteId,
  getHistoriaClinicaByPacienteRut: controller.getHistoriaClinicaByPacienteRut,

  createAnamnesis: controller.createAnamnesis.bind(controller),
  getAnamnesisByHistoriaClinicaId:
    controller.getAnamnesisByHistoriaClinicaId.bind(controller),
  updateAnamnesis: controller.updateAnamnesis.bind(controller),
  deleteAnamnesis: controller.deleteAnamnesis.bind(controller),

  createExploracionFisica: controller.createExploracionFisica.bind(controller),
  getExploracionFisicaByHistoriaClinicaId:
    controller.getExploracionFisicaByHistoriaClinicaId.bind(controller),
  updateExploracionFisica: controller.updateExploracionFisica.bind(controller),
  deleteExploracionFisica: controller.deleteExploracionFisica.bind(controller),

  createDiagnostico: controller.createDiagnostico.bind(controller),
  getDiagnosticosByHistoriaClinicaId:
    controller.getDiagnosticosByHistoriaClinicaId.bind(controller),
  updateDiagnostico: controller.updateDiagnostico.bind(controller),
  deleteDiagnostico: controller.deleteDiagnostico.bind(controller),

  createPlanTratamiento: controller.createPlanTratamiento.bind(controller),
  getPlanesTratamientoByHistoriaClinica:
    controller.getPlanesTratamientoByHistoriaClinica.bind(controller),
  getPlanTratamientoById: controller.getPlanTratamientoById.bind(controller),
  updatePlanTratamiento: controller.updatePlanTratamiento.bind(controller),
  deletePlanTratamiento: controller.deletePlanTratamiento.bind(controller),

  createPruebasIniciales: controller.createPruebasIniciales.bind(controller),
  getPruebasInicialesByPacienteId:
    controller.getPruebasInicialesByPacienteId.bind(controller),
  updatePruebasIniciales: controller.updatePruebasIniciales.bind(controller),
  deletePruebasIniciales: controller.deletePruebasIniciales.bind(controller),
};
