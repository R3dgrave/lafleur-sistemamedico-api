const { z } = require("zod");

//Administrador
const administradorSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre deber tener al menos 1 caracter")
    .max(100, "El(Los) nombre(s) no puede(n) tener más de 100 caracteres"),
  apellido: z
    .string()
    .min(1, "El apellido es obligatorio")
    .max(100, "El(Los) apellido(s) no puede(n) tener más de 100 caracteres"),
  email: z
    .string()
    .email("Email invalido")
    .regex(/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim),
  password_hash: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(225, "La contraseña no puede tener más de 225 caracteres"),
});
const loginSchema = z.object({
  email: z
    .string()
    .email("Email invalido")
    .regex(/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim),
  password_hash: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(225, "La contraseña no puede tener más de 225 caracteres"),
});
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Email invalido")
    .regex(/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim),
});
const changePasswordSchema = z.object({
  password_hash: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(225, "La contraseña no puede tener más de 225 caracteres"),
});

//Pacientes
const pacienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(50, "El nombre no puede exceder los 50 caracteres.")
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      "El nombre solo puede contener letras y espacios."
    ),
  apellido: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres.")
    .max(50, "El apellido no puede exceder los 50 caracteres.")
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      "El apellido solo puede contener letras y espacios."
    ),
  fecha_nacimiento: z
    .string()
    .min(1, "La fecha de nacimiento es requerida.")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, "La fecha de nacimiento debe ser una fecha válida y no puede ser en el futuro.")
    .transform((val) => new Date(val).toISOString().split("T")[0]), // Asegura formato YYYY-MM-DD
  genero: z.enum(
    ["Masculino", "Femenino", "No Binario", "Otro", "Prefiero no decir"],
    {
      errorMap: () => ({ message: "Género inválido." }),
    }
  ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido.")
    .min(1, "El email es requerido."),
  telefono: z
    .string()
    .trim()
    .min(8, "El teléfono debe tener al menos 8 dígitos.") // Ajusta según el formato chileno
    .max(15, "El teléfono no puede exceder los 15 dígitos.")
    .regex(
      /^\+?\d{8,15}$/,
      "Formato de teléfono inválido. Use solo números y opcionalmente un '+' al inicio."
    ), // Ejemplo para números internacionales/chilenos
  direccion: z
    .string()
    .trim()
    .min(5, "La dirección debe tener al menos 5 caracteres.")
    .max(200, "La dirección no puede exceder los 200 caracteres.")
    .optional(), // Sigue siendo opcional
  identidad_genero: z
    .string()
    .trim()
    .max(50, "Máximo 50 caracteres.")
    .optional(),
  sexo_registral: z.string().trim().max(50, "Máximo 50 caracteres.").optional(),
});

const createPacienteSchema = pacienteSchema.extend({
  email: z
    .string()
    .email("Formato de email inválido.")
    .max(100, "El email no puede exceder 100 caracteres."),
  rut: z
    .string()
    .trim()
    .min(1, "El RUT es requerido.")
    .max(20, "El RUT no puede exceder 20 caracteres.")
    .regex(
      /^(\d{1,3}(?:\.\d{1,3}){2}-(\d|[Kk]))$/,
      "Formato de RUT inválido. Ejemplo: 12.345.678-9 o 12345678-K"
    ),
});

const updatePacienteSchema = pacienteSchema.partial();

//Contacto de emergencia
const contactoEmergenciaSchema = z.object({
  rut_paciente: z
    .string()
    .max(20, "El RUT del paciente no puede exceder 20 caracteres.")
    .min(1, "El RUT del paciente es requerido."),
  nombre_contacto: z
    .string()
    .min(2, "El nombre de contacto debe tener al menos 2 caracteres.")
    .max(100, "El nombre de contacto no puede exceder 100 caracteres."),
  telefono_contacto: z
    .string()
    .min(5, "El teléfono de contacto debe tener al menos 5 caracteres.")
    .max(20, "El teléfono de contacto no puede exceder 20 caracteres."),
  relacion_paciente: z
    .string()
    .max(50, "La relación no puede exceder 50 caracteres.")
    .optional()
    .nullable(),
});
const createContactoEmergenciaSchema = contactoEmergenciaSchema;
const updateContactoEmergenciaSchema = contactoEmergenciaSchema.partial();

// Citas
const citaSchema = z.object({
  paciente_id: z
    .number()
    .int()
    .positive(
      "El ID del paciente es requerido y debe ser un número entero positivo."
    ),
  tipo_atencion_id: z
    .number()
    .int()
    .positive(
      "El ID del tipo de atención es requerido y debe ser un número entero positivo."
    ),
  fecha_hora_cita: z
    .string()
    .datetime("Formato de fecha y hora de cita inválido.")
    .transform((val) => new Date(val)),
  estado_cita: z
    .enum(["Pendiente", "Confirmada", "Cancelada", "Completada"])
    .default("Pendiente"),
  notas: z.string().optional().nullable(),
  administrador_id: z
    .number({
      required_error: "El ID del administrador es requerido.",
    })
    .int()
    .positive(),
});
const horarioDisponibleSchema = z
  .object({
    administrador_id: z
      .number()
      .int()
      .positive("ID de administrador inválido."),
    dia_semana: z
      .number()
      .int()
      .min(0)
      .max(6, "El día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)."),
    hora_inicio: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Formato de hora de inicio inválido (HH:MM)."),
    hora_fin: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Formato de hora de fin inválido (HH:MM)."),
  })
  .refine((data) => data.hora_inicio < data.hora_fin, {
    message: "La hora de inicio debe ser anterior a la hora de fin.",
    path: ["hora_fin"],
  });

// Esquema para Excepciones_Disponibilidad
const excepcionDisponibilidadSchema = z
  .object({
    administrador_id: z
      .number()
      .int()
      .positive("ID de administrador inválido."),
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD).")
      .transform((val) => new Date(val)),
    hora_inicio_bloqueo: z
      .string()
      .regex(
        /^\d{2}:\d{2}$/,
        "Formato de hora de inicio de bloqueo inválido (HH:MM)."
      )
      .optional()
      .nullable(),
    hora_fin_bloqueo: z
      .string()
      .regex(
        /^\d{2}:\d{2}$/,
        "Formato de hora de fin de bloqueo inválido (HH:MM)."
      )
      .optional()
      .nullable(),
    es_dia_completo: z.boolean().default(false),
    descripcion: z.string().max(255).optional().nullable(),
  })
  .refine(
    (data) => {
      // Si no es día completo, deben estar ambas horas de inicio y fin de bloqueo
      if (
        !data.es_dia_completo &&
        (!data.hora_inicio_bloqueo || !data.hora_fin_bloqueo)
      ) {
        return false;
      }
      // Si hay horas, inicio debe ser antes que fin
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
        "Para bloqueos parciales, hora de inicio y fin son requeridas y la hora de inicio debe ser anterior a la hora de fin.",
      path: ["hora_fin_bloqueo"],
    }
  );

const createCitaSchema = citaSchema;
const updateCitaSchema = citaSchema.partial();

module.exports = {
  administradorSchema,
  loginSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  pacienteSchema,
  createPacienteSchema,
  updatePacienteSchema,
  contactoEmergenciaSchema,
  createContactoEmergenciaSchema,
  updateContactoEmergenciaSchema,
  citaSchema,
  createCitaSchema,
  updateCitaSchema,
  horarioDisponibleSchema,
  excepcionDisponibilidadSchema,
};
