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
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede exceder 100 caracteres."),
  apellido: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres.")
    .max(100, "El apellido no puede exceder 100 caracteres."),
  fecha_nacimiento: z
    .string()
    .refine(
      (val) => !isNaN(new Date(val).getTime()),
      "Fecha de nacimiento inválida."
    )
    .transform((val) => new Date(val)),
  genero: z.enum(
    ["Femenino", "Masculino", "Otro"],
    "El género debe ser 'Femenino', 'Masculino' o 'Otro'."
  ),
  identidad_genero: z
    .string()
    .max(50, "La identidad de género no puede exceder 50 caracteres.")
    .optional()
    .nullable(),
  sexo_registral: z
    .string()
    .max(20, "El sexo registral no puede exceder 20 caracteres.")
    .optional()
    .nullable(),
  telefono: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres.")
    .optional()
    .nullable(),
  email: z
    .string()
    .email("Formato de email inválido.")
    .max(100, "El email no puede exceder 100 caracteres.")
    .optional(), // Optional para update, NOT NULL para create
  direccion: z
    .string()
    .max(255, "La dirección no puede exceder 255 caracteres.")
    .optional()
    .nullable(),
  rut: z
    .string()
    .max(20, "El RUT no puede exceder 20 caracteres.")
    .optional()
    .nullable(),
});
const createPacienteSchema = pacienteSchema.extend({
  email: z
    .string()
    .email("Formato de email inválido.")
    .max(100, "El email no puede exceder 100 caracteres."),
  rut: z.string().max(20, "El RUT no puede exceder 20 caracteres.").optional(), // O .nullable() si es un campo que puede ser nulo
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
};
