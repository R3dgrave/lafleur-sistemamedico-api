// Importaciones de módulos y utilidades
const db = require("../../models/index"); // Acceso a los modelos de Sequelize
const Administrador = db.Administrador; // Modelo del Administrador
const { hashPassword, comparePassword } = require("../utils/hash"); // Utilidades para hashing de contraseñas
const transporter = require("../config/nodemailer"); // Configuración de Nodemailer para envío de correos
const crypto = require("crypto"); // Módulo nativo de Node.js para criptografía
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt"); // Utilidades para gestión de JWT
const {
  loginSchema,
  administradorSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} = require("../utils/validation"); // Esquemas de validación con Zod

// Constante para la expiración del Refresh Token en días, obtenida de variables de entorno.
const REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS = parseInt(
  process.env.REFRESH_TOKEN_EXPIRATION_DAYS || "7",
  10
);

/**
 * Registra un nuevo administrador en el sistema.
 * Valida los datos de entrada, hashea la contraseña y crea el registro en la base de datos.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const registerAdmin = async (req, res, next) => {
  try {
    // Valida los datos del cuerpo de la solicitud usando el esquema `administradorSchema` de Zod.
    const validatedData = administradorSchema.parse(req.body);
    const { nombre, apellido, email, password_hash } = validatedData;

    // Hashea la contraseña antes de almacenarla en la base de datos por seguridad.
    const hashedPassword = await hashPassword(password_hash);

    // Crea un nuevo registro de administrador.
    const newAdmin = await Administrador.create({
      nombre,
      apellido,
      email,
      password_hash: hashedPassword,
    });

    // Envía una respuesta de éxito con el nuevo administrador (sin la contraseña hasheada).
    res.status(201).json({
      message: "Administrador registrado exitosamente",
      user: newAdmin, // Considera enviar solo datos públicos del usuario.
    });
  } catch (error) {
    // Pasa cualquier error (incluyendo ZodError o SequelizeUniqueConstraintError)
    // al middleware centralizado de manejo de errores.
    next(error);
  }
};

/**
 * Autentica a un administrador.
 * Verifica las credenciales, genera tokens de acceso y refresco, y establece el refresh token en una cookie.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const loginAdmin = async (req, res, next) => {
  try {
    // Valida los datos de inicio de sesión.
    const validatedData = loginSchema.parse(req.body);
    const { email, password_hash } = validatedData;

    // Busca al administrador por email.
    const admin = await Administrador.findOne({ where: { email } });

    // Verifica si el administrador existe y si la contraseña es correcta.
    if (
      !admin ||
      !(await comparePassword(password_hash, admin.password_hash))
    ) {
      // Si las credenciales son inválidas, devuelve un error 401.
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    // Genera un token de acceso (AccessToken) que expira rápidamente.
    const accessToken = generateAccessToken({
      id: admin.administrador_id,
      email: admin.email,
    });

    // Genera un token de refresco (RefreshToken) que tiene una vida útil más larga.
    const refreshToken = generateRefreshToken(admin.administrador_id);

    // Establece el Refresh Token como una cookie HTTP-only y segura.
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // No accesible por JavaScript del lado del cliente.
      secure: process.env.NODE_ENV === "production", // Solo se envía sobre HTTPS en producción.
      sameSite: "strict", // Protege contra ataques CSRF.
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000, // Duración de la cookie.
    });

    // Envía una respuesta de éxito con el Access Token y los datos del usuario.
    res.status(200).json({
      message: "Inicio de sesión exitoso",
      accessToken,
      user: {
        id: admin.administrador_id,
        nombre: admin.nombre,
        email: admin.email,
      },
    });
  } catch (error) {
    // Pasa cualquier error al middleware centralizado de manejo de errores.
    next(error);
  }
};

/**
 * Cierra la sesión de un administrador.
 * Elimina el refresh token de las cookies del cliente.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const logoutAdmin = async (req, res, next) => {
  try {
    // Limpia la cookie del refresh token.
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Sesión cerrada exitosamente." });
  } catch (error) {
    // Pasa cualquier error al middleware centralizado de manejo de errores.
    next(error);
  }
};

/**
 * Refresca el token de acceso utilizando un refresh token existente.
 * Valida el refresh token, genera un nuevo access token y un nuevo refresh token.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken; // Obtiene el refresh token de las cookies.

    // Si no hay refresh token, devuelve un error 401.
    if (!oldRefreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh Token no encontrado en las cookies." });
    }

    // Verifica y decodifica el refresh token.
    const decoded = verifyRefreshToken(oldRefreshToken);
    // Si el token es inválido o no contiene un ID, limpia la cookie y devuelve un error 401.
    if (!decoded || !decoded.id) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res
        .status(401)
        .json({ message: "Refresh Token inválido o expirado." });
    }

    const administradorId = decoded.id;

    // Genera un nuevo Access Token.
    const newAccessToken = generateAccessToken({ id: administradorId });

    // Genera un nuevo Refresh Token para rotación de tokens (mejora la seguridad).
    const newRefreshToken = generateRefreshToken(administradorId);
    // Establece el nuevo Refresh Token en una cookie.
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Token de acceso refrescado exitosamente",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Error al refrescar el token:", error.message);
    // En caso de error, limpia la cookie del refresh token (por si acaso) y devuelve un error 401.
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    // Pasa el error al middleware centralizado de manejo de errores.
    // Se puede crear un error personalizado aquí si se necesita un mensaje más específico en el toast.
    next(error);
  }
};

/**
 * Obtiene la información del usuario autenticado.
 * Esta función asume que `req.user` ya ha sido poblado por el middleware de autenticación (`protect`).
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAuthenticatedUser = async (req, res, next) => {
  try {
    // `req.user` es establecido por el middleware `protect` si el token es válido.
    if (req.user) {
      return res.status(200).json({
        id: req.user.administrador_id, // Asegurarse de que el ID se envía si es necesario en el frontend.
        email: req.user.email,
        nombre: req.user.nombre || "Usuario", // Fallback si el nombre no está definido.
        apellido: req.user.apellido || "", // Incluir apellido si es relevante.
      });
    } else {
      // Si `req.user` no está presente, significa que el middleware `protect` no autenticó al usuario.
      return res
        .status(401)
        .json({
          message: "No se encontró información de usuario autenticado.",
        });
    }
  } catch (error) {
    next(error); // Pasa cualquier error al middleware centralizado de manejo de errores.
  }
};

/**
 * Maneja la solicitud de restablecimiento de contraseña.
 * Genera un token de restablecimiento, lo guarda en la DB y envía un email al usuario.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const forgotPassword = async (req, res, next) => {
  let administrador; // Se declara aquí para que sea accesible en el bloque catch.
  try {
    // Valida el email de la solicitud.
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    // Busca al administrador por email.
    administrador = await Administrador.findOne({ where: { email } });

    // Es una buena práctica de seguridad no revelar si el email existe o no.
    // Siempre se envía el mismo mensaje para evitar la enumeración de usuarios.
    if (!administrador) {
      return res.status(200).json({
        message:
          "Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña.",
      });
    }

    // Genera un token de restablecimiento de contraseña (método definido en el modelo Administrador).
    const resetToken = administrador.getResetPasswordToken();
    // Guarda el token hasheado y su fecha de expiración en la base de datos.
    await administrador.save({
      fields: ["resetPasswordToken", "resetPasswordExpires"],
    });

    // Construye la URL de restablecimiento que se enviará al usuario.
    const resetUrl = `${process.env.FRONTEND_URL}/restablecer-contrasena/${resetToken}`;

    // Define las opciones del correo electrónico.
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: administrador.email,
      subject: "Restablecimiento de Contraseña",
      html: `
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Por favor, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <p><a href="${resetUrl}">Restablecer Contraseña</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste un restablecimiento de contraseña, ignora este correo electrónico.</p>
      `,
    };

    // Envía el correo electrónico.
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message:
        "Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña.",
    });
  } catch (error) {
    console.error("Error al solicitar restablecimiento de contraseña:", error);
    // En caso de error en el envío del correo o guardado, limpia los tokens para evitar tokens huérfanos.
    if (administrador) {
      administrador.resetPasswordToken = null;
      administrador.resetPasswordExpires = null;
      await administrador.save(); // Guarda los cambios para limpiar los tokens.
    }
    next(error); // Pasa el error al middleware centralizado.
  }
};

/**
 * Restablece la contraseña de un administrador utilizando un token de restablecimiento.
 * @param {Object} req - Objeto de solicitud de Express (req.params.token contiene el token).
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    // Valida la nueva contraseña.
    const validatedData = changePasswordSchema.parse(req.body);
    const { password_hash } = validatedData;

    // Hashea el token recibido para compararlo con el hasheado en la base de datos.
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Busca al administrador por el token hasheado y verifica que no haya expirado.
    const administrador = await Administrador.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [require("sequelize").Op.gt]: Date.now() }, // Verifica que la fecha de expiración sea mayor que la actual.
      },
    });

    // Si el administrador no se encuentra o el token ha expirado, devuelve un error 400.
    if (!administrador) {
      return res
        .status(400)
        .json({ message: "Token de restablecimiento inválido o expirado." });
    }

    // Actualiza la contraseña del administrador y limpia los campos del token de restablecimiento.
    administrador.password_hash = password_hash; // La validación Zod ya asegura que es una contraseña válida.
    administrador.resetPasswordToken = null;
    administrador.resetPasswordExpires = null;
    await administrador.save(); // Guarda los cambios.

    res.status(200).json({ message: "Contraseña restablecida exitosamente." });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    next(error); // Pasa cualquier error al middleware centralizado.
  }
};

/**
 * Obtiene todos los administradores registrados (solo datos públicos).
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware de errores.
 */
const getAllAdministrator = async (req, res, next) => {
  try {
    // Busca todos los administradores, seleccionando solo atributos seguros y públicos.
    const admins = await Administrador.findAll({
      attributes: ["administrador_id", "nombre", "apellido", "email"],
    });
    res.status(200).json(admins);
  } catch (error) {
    console.error("Error al obtener administradores:", error);
    next(error); // Pasa cualquier error al middleware centralizado.
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getAuthenticatedUser,
  forgotPassword,
  resetPassword,
  getAllAdministrator,
};
