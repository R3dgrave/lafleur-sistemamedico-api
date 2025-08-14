// src/utils/validation.js
const { z } = require("zod");
const { DateTime } = require('luxon');
const CHILE_TIMEZONE = 'America/Santiago';

// =================================================================
// === VALIDACIONES REUTILIZABLES ===
// =================================================================

const stringRequired = (message) => z.string().min(1, message);
const emailString = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo es requerido")
  .email("Formato de email inválido.");

const passwordString = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres")
  .max(225, "La contraseña no puede tener más de 225 caracteres");

const rutString = z
  .string()
  .trim()
  .min(1, "El RUT es requerido.")
  .max(20, "El RUT no puede exceder 20 caracteres.")
  .regex(
    /^(\d{1,3}(?:\.\d{1,3}){2}-(\d|[Kk]))$/,
    "Formato de RUT inválido. Ejemplo: 12.345.678-9"
  );

const nombreString = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(50, "El nombre no puede exceder los 50 caracteres.")
  .regex(
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    "El nombre solo puede contener letras y espacios."
  );

const apellidoString = z
  .string()
  .trim()
  .min(2, "El apellido debe tener al menos 2 caracteres.")
  .max(50, "El apellido no puede exceder los 50 caracteres.")
  .regex(
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    "El apellido solo puede contener letras y espacios."
  );

const telefonoString = z
  .string()
  .trim()
  .min(8, "El teléfono debe tener al menos 8 dígitos.")
  .max(15, "El teléfono no puede exceder los 15 dígitos.")
  .regex(
    /^\+?\d{8,15}$/,
    "Formato de teléfono inválido. Use solo números y opcionalmente un '+' al inicio."
  );

const idNumber = z
  .number()
  .int()
  .positive("ID requerido y debe ser un número entero positivo.");

const CHILE_DATE_TRANSFORM = z.string().refine((val) => {
  const date = new Date(val);
  return !isNaN(date.getTime()) && date <= new Date();
}, "La fecha debe ser una fecha válida y no puede ser en el futuro.")
.transform((val) => new Date(val).toISOString().split("T")[0]);

const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM).");

// =================================================================
// === ENUMS REUTILIZABLES ===
// =================================================================

const GENERO_ENUM = ["Masculino", "Femenino", "No Binario", "Otro", "Prefiero no decir"];
const CITA_ESTADO_ENUM = ["Pendiente", "Confirmada", "Cancelada", "Completada"];
const DIAGNOSTICO_ESTADO_ENUM = ["Activo", "Resuelto", "Crónico", "Inactivo"];

// =================================================================
// === ESQUEMAS DE ADMINISTRADOR ===
// =================================================================

const administradorBaseSchema = z.object({
  nombre: nombreString,
  apellido: apellidoString,
  email: emailString.max(100),
  password_hash: passwordString,
});

const administradorSchema = administradorBaseSchema;

const loginSchema = z.object({
  email: emailString,
  password_hash: passwordString,
});

const forgotPasswordSchema = z.object({
  email: emailString,
});

const changePasswordSchema = z.object({
  password_hash: passwordString,
});

const updateProfileSchema = z.object({
  nombre: nombreString.optional(),
  apellido: apellidoString.optional(),
  email: emailString.optional(),
  profile_picture_url: z
    .string()
    .url("Formato de URL de imagen inválido.")
    .optional()
    .nullable(),
});

const updatePasswordSchema = z
  .object({
    current_password: stringRequired("La contraseña actual es requerida."),
    new_password: stringRequired("La nueva contraseña debe tener al menos 6 caracteres.").min(6),
    confirm_new_password: stringRequired("La confirmación de la nueva contraseña es requerida.").min(6),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Las nuevas contraseñas no coinciden.",
    path: ["confirm_new_password"],
  });

const updateNotificationPreferencesSchema = z.object({
  receive_email_notifications: z.boolean().optional(),
  receive_sms_notifications: z.boolean().optional(),
});

// =================================================================
// === ESQUEMAS DE PACIENTES ===
// =================================================================

const pacienteBaseSchema = z.object({
  nombre: nombreString,
  apellido: apellidoString,
  fecha_nacimiento: CHILE_DATE_TRANSFORM,
  genero: z.enum(GENERO_ENUM, { errorMap: () => ({ message: "Género inválido." }) }),
  email: emailString,
  telefono: telefonoString,
  direccion: z.string().trim().min(5).max(200).optional().nullable(),
  identidad_genero: z.string().trim().max(50).optional().nullable(),
  sexo_registral: z.string().trim().max(50).optional().nullable(),
});

const createPacienteSchema = pacienteBaseSchema.extend({
  rut: rutString,
});

const updatePacienteSchema = createPacienteSchema.partial();

// =================================================================
// === ESQUEMAS DE CONTACTO DE EMERGENCIA ===
// =================================================================

const createContactoEmergenciaSchema = z.object({
  rut_paciente: rutString.min(1, "El RUT del paciente es requerido."),
  nombre_contacto: nombreString.max(100),
  telefono_contacto: telefonoString.max(20),
  relacion_paciente: z.string().max(50).optional().nullable(),
});

const updateContactoEmergenciaSchema = createContactoEmergenciaSchema.partial();

// =================================================================
// === ESQUEMAS DE CITAS ===
// =================================================================

const createCitaSchema = z.object({
  paciente_id: idNumber,
  tipo_atencion_id: idNumber,
  administrador_id: idNumber,
  fecha_hora_cita: z.string().datetime("Formato de fecha y hora de cita inválido.").transform((val) => new Date(val)),
  estado_cita: z.enum(CITA_ESTADO_ENUM).default("Pendiente"),
  notas: z.string().optional().nullable(),
});

const updateCitaSchema = createCitaSchema.partial();

// =================================================================
// === ESQUEMAS DE HORARIOS Y EXCEPCIONES ===
// =================================================================

const horarioDisponibleBaseSchema = z
  .object({
    dia_semana: z.number().int().min(0).max(6, "El día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)."),
    hora_inicio: timeString,
    hora_fin: timeString,
  })
  .refine((data) => data.hora_inicio < data.hora_fin, {
    message: "La hora de inicio debe ser anterior a la hora de fin.",
    path: ["hora_fin"],
  });

const createHorarioDisponibleSchema = horarioDisponibleBaseSchema;
const updateHorarioDisponibleSchema = createHorarioDisponibleSchema.partial();

const excepcionDisponibilidadBaseSchema = z
  .object({
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD).")
    .transform((val, ctx) => {
      const localDate = DateTime.fromISO(val, { zone: CHILE_TIMEZONE });
      if (!localDate.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_date,
          message: 'Fecha inválida.',
        });
        return z.NEVER;
      }
      return val; // Mantener como string 'YYYY-MM-DD' para la base de datos
    }),
    es_dia_completo: z.boolean().default(false),
    hora_inicio_bloqueo: timeString.optional().nullable(),
    hora_fin_bloqueo: timeString.optional().nullable(),
    descripcion: z.string().max(255).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.es_dia_completo && (!data.hora_inicio_bloqueo || !data.hora_fin_bloqueo)) {
        return false;
      }
      if (
        data.hora_inicio_bloqueo &&
        data.hora_fin_bloqueo &&
        data.hora_inicio_bloqueo >= data.hora_fin_bloqueo
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Para bloqueos parciales, la hora de inicio y fin son requeridas y la hora de inicio debe ser anterior a la hora de fin.",
      path: ["hora_fin_bloqueo"],
    }
  );

const createExcepcionDisponibilidadSchema = excepcionDisponibilidadBaseSchema;
const updateExcepcionDisponibilidadSchema = createExcepcionDisponibilidadSchema.partial();

// =================================================================
// === ESQUEMAS DE HISTORIAL CLÍNICO ===
// =================================================================

const historiaClinicaBaseSchema = z.object({
  historia_clinica_id: idNumber,
  cita_id: idNumber.optional().nullable(),
});

const createHistoriaClinicaSchema = z.object({
  paciente_id: idNumber,
});

const createAnamnesisSchema = historiaClinicaBaseSchema.extend({
  motivo_consulta: z.string().trim().max(1000).optional().nullable(),
  antecedentes_personales: z.string().trim().max(2000).optional().nullable(),
  antecedentes_familiares: z.string().trim().max(2000).optional().nullable(),
  medicamentos_actuales: z.string().trim().max(1000).optional().nullable(),
  alergias: z.string().trim().max(1000).optional().nullable(),
  otros_antecedentes: z.string().trim().max(2000).optional().nullable(),
  aqx: z.string().trim().max(1000).optional().nullable(),
  amp: z.string().trim().max(1000).optional().nullable(),
  habitos_tabaco: z.boolean().default(false).optional(),
  habitos_alcohol: z.boolean().default(false).optional(),
  habitos_alimentacion: z.string().trim().max(1000).optional().nullable(),
});

const updateAnamnesisSchema = createAnamnesisSchema.partial();

const createExploracionFisicaSchema = historiaClinicaBaseSchema.extend({
  hallazgos: z.string().trim().max(3000).optional().nullable(),
  region_explorada: z.string().trim().max(100).optional().nullable(),
});

const updateExploracionFisicaSchema = createExploracionFisicaSchema.partial();

const createDiagnosticoSchema = historiaClinicaBaseSchema.extend({
  codigo_cie: z.string().trim().max(20).optional().nullable(),
  nombre_diagnostico: z.string().trim().min(1, "El nombre del diagnóstico es requerido.").max(255),
  descripcion: z.string().trim().max(2000).optional().nullable(),
  es_principal: z.boolean().default(false).optional(),
  estado_diagnostico: z.enum(DIAGNOSTICO_ESTADO_ENUM).default("Activo").optional(),
});

const updateDiagnosticoSchema = createDiagnosticoSchema.partial();

const createPlanTratamientoSchema = historiaClinicaBaseSchema.extend({
  // fecha_registro tiene un valor por defecto en la base de datos, por lo que no es necesario enviarlo desde el frontend.
  // Pero si se envía, se valida como un string de fecha (ISO 8601).
  fecha_registro: z.string({
    invalid_type_error: 'La fecha de registro debe ser una fecha válida.',
  }).datetime('La fecha de registro debe ser una fecha válida en formato ISO 8601.').optional(),

  // descripcion_plan es un campo de texto requerido.
  descripcion_plan: z.string({
    required_error: 'La descripción del plan es obligatoria.',
    invalid_type_error: 'La descripción del plan debe ser una cadena de texto.',
  }).min(1, 'La descripción del plan no puede estar vacía.'),

  // medicamentos_recetados es opcional.
  medicamentos_recetados: z.string({
    invalid_type_error: 'Los medicamentos recetados deben ser una cadena de texto.',
  }).optional().nullable(),

  // indicaciones_adicionales es opcional.
  indicaciones_adicionales: z.string({
    invalid_type_error: 'Las indicaciones adicionales deben ser una cadena de texto.',
  }).optional().nullable(),

  // proxima_cita_recomendada es opcional.
  proxima_cita_recomendada: z.string({
    invalid_type_error: 'La fecha de la próxima cita recomendada debe ser una fecha válida.',
  }).date('La fecha de la próxima cita recomendada debe ser una fecha válida en formato YYYY-MM-DD.').optional().nullable(),
  
  // receta_adjunta_url es opcional.
  receta_adjunta_url: z.string({
    invalid_type_error: 'La URL de la receta adjunta debe ser una cadena de texto.',
  }).url('La URL de la receta adjunta debe ser un formato de URL válido.').optional().nullable(),
});

const updatePlanTratamientoSchema = createPlanTratamientoSchema.partial();

const createPruebasInicialesSchema = historiaClinicaBaseSchema.extend({
  fecha_registro: z.coerce.date().optional(),
  peso: z.number().min(1,"El peso es requerido").max(999.99),
  altura: z.number().min(0).max(9.99).optional().nullable(),
  imc: z.number().min(0).max(99.99).optional().nullable(),
  perimetro_cintura: z.number().min(0).max(999.99).optional().nullable(),
  perimetro_cadera: z.number().min(0).max(999.99).optional().nullable(),
  presion_sistolica: z.number().int().positive().optional().nullable(),
  presion_diastolica: z.number().int().positive().optional().nullable(),
  frecuencia_cardiaca: z.number().int().positive().optional().nullable(),
  temperatura: z.number().min(0).max(99.9).optional().nullable(),
  saturacion_oxigeno: z.number().min(0).max(100).optional().nullable(),
  notas_adicionales: z.string().optional().nullable(),
});

const updatePruebasInicialesSchema = createPruebasInicialesSchema.partial();

module.exports = {
  administradorSchema,
  loginSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  updatePasswordSchema,
  updateNotificationPreferencesSchema,

  createPacienteSchema,
  updatePacienteSchema,

  createContactoEmergenciaSchema,
  updateContactoEmergenciaSchema,

  createCitaSchema,
  updateCitaSchema,

  createHorarioDisponibleSchema,
  updateHorarioDisponibleSchema,

  createExcepcionDisponibilidadSchema,
  updateExcepcionDisponibilidadSchema,

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
  updatePruebasInicialesSchema
};
