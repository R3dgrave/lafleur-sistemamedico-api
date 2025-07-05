const { z } = require("zod");

const administradorSchema = z.object({
  nombre: z
    .string("El nombre es obligatorio")
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

module.exports = {
  administradorSchema,
  loginSchema,
};
