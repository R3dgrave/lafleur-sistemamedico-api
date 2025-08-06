// src/controllers/auth.controller.js
const db = require("../../models/index");
const Administrador = db.Administrador;
const { comparePassword } = require("../utils/hash");
const transporter = require("../config/nodemailer");
const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const {
  loginSchema,
  administradorSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  updatePasswordSchema,
  updateNotificationPreferencesSchema,
} = require("../utils/validation");
const multer = require("multer");
const supabase = require("../config/supabase");
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  CustomError,
} = require("../utils/customErrors");

// Constantes
const REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS = parseInt(
  process.env.REFRESH_TOKEN_EXPIRATION_DAYS || "7",
  10
);
const SUPABASE_PROFILE_BUCKET =
  process.env.SUPABASE_PROFILE_BUCKET || "profile-pictures";

// Configuración de Multer para almacenamiento en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new CustomError("Solo se permiten imágenes (jpeg, jpg, png, gif)", 400));
  },
});

/**
 * Función auxiliar para subir un archivo a Supabase Storage.
 * @param {Buffer} buffer - El buffer del archivo a subir.
 * @param {string} mimetype - El tipo MIME del archivo.
 * @param {string} originalname - El nombre original del archivo.
 * @param {string} folderPath - La ruta de la carpeta dentro del bucket.
 * @returns {Promise<string>} La URL pública del archivo subido.
 */
const uploadFileToSupabase = async (
  buffer,
  mimetype,
  originalname,
  folderPath
) => {
  const fileExtension = originalname.split(".").pop();
  const filename = `${folderPath}/${Date.now()}-${crypto
    .randomBytes(8)
    .toString("hex")}.${fileExtension}`;

  const { error } = await supabase.storage
    .from(SUPABASE_PROFILE_BUCKET)
    .upload(filename, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    console.error("Error al subir a Supabase Storage:", error);
    throw new CustomError("Fallo al subir la imagen de perfil.", 500);
  }

  const { data: publicUrlData } = supabase.storage
    .from(SUPABASE_PROFILE_BUCKET)
    .getPublicUrl(filename);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new CustomError(
      "No se pudo obtener la URL pública del archivo.",
      500
    );
  }

  return publicUrlData.publicUrl;
};

/**
 * Función auxiliar para eliminar un archivo de Supabase Storage.
 * @param {string} fileUrl - La URL completa del archivo a eliminar.
 * @returns {Promise<void>}
 */
const deleteFileFromSupabase = async (fileUrl) => {
  const pathSegments = fileUrl.split("/public/");
  if (pathSegments.length < 2) {
    console.warn("URL de archivo inválida para Supabase Storage:", fileUrl);
    return;
  }
  const filePath = pathSegments[1].substring(
    SUPABASE_PROFILE_BUCKET.length + 1
  );

  const { error } = await supabase.storage
    .from(SUPABASE_PROFILE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error(
      `Error al eliminar el archivo ${filePath} de Supabase Storage:`,
      error
    );
  } else {
    console.log(`Archivo ${filePath} eliminado de Supabase Storage.`);
  }
};

/**
 * Establece el refresh token en una cookie.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {string} refreshToken - El token a establecer.
 */
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  });
};

/**
 * Cierra la sesión de un administrador.
 * Elimina el refresh token de las cookies del cliente.
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

/**
 * Registra un nuevo administrador en el sistema.
 */
const registerAdmin = async (req, res, next) => {
  try {
    const validatedData = administradorSchema.parse(req.body);
    // La contraseña se hashea automáticamente con el hook beforeCreate del modelo.
    const newAdmin = await Administrador.create(validatedData);

    res.status(201).json({
      message: "Administrador registrado exitosamente",
      user: {
        id: newAdmin.administrador_id,
        nombre: newAdmin.nombre,
        apellido: newAdmin.apellido,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Autentica a un administrador.
 */
const loginAdmin = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password_hash } = validatedData;

    const admin = await Administrador.findOne({ where: { email } });

    if (
      !admin ||
      !(await comparePassword(password_hash, admin.password_hash))
    ) {
      throw new UnauthorizedError("Credenciales inválidas.");
    }

    const accessToken = generateAccessToken({
      id: admin.administrador_id,
      email: admin.email,
      role: admin.role,
    });
    const refreshToken = generateRefreshToken(admin.administrador_id);

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      accessToken,
      user: {
        id: admin.administrador_id,
        nombre: admin.nombre,
        apellido: admin.apellido,
        email: admin.email,
        role: admin.role,
        profilePictureUrl: admin.profile_picture_url,
        receive_email_notifications: admin.receive_email_notifications,
        receive_sms_notifications: admin.receive_sms_notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cierra la sesión de un administrador.
 */
const logoutAdmin = (req, res) => {
  clearRefreshTokenCookie(res);
  res.status(200).json({ message: "Sesión cerrada exitosamente." });
};

/**
 * Refresca el token de acceso utilizando un refresh token existente.
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) {
      throw new UnauthorizedError(
        "Refresh Token no encontrado en las cookies."
      );
    }

    const decoded = verifyRefreshToken(oldRefreshToken);
    if (!decoded || !decoded.id) {
      clearRefreshTokenCookie(res);
      throw new UnauthorizedError("Refresh Token inválido o expirado.");
    }

    const admin = await Administrador.findByPk(decoded.id, {
      attributes: [
        "administrador_id",
        "email",
        "role",
        "profile_picture_url",
        "receive_email_notifications",
        "receive_sms_notifications",
      ],
    });

    if (!admin) {
      clearRefreshTokenCookie(res);
      throw new UnauthorizedError(
        "Usuario asociado al Refresh Token no encontrado."
      );
    }

    const newAccessToken = generateAccessToken({
      id: admin.administrador_id,
      email: admin.email,
      role: admin.role,
    });
    const newRefreshToken = generateRefreshToken(admin.administrador_id);
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      message: "Token de acceso refrescado exitosamente",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Error al refrescar el token:", error.message);
    clearRefreshTokenCookie(res);
    // Error genérico para no dar pistas sobre la causa del fallo.
    next(
      new UnauthorizedError("No se pudo refrescar el token de autenticación.")
    );
  }
};

/**
 * Obtiene la información del usuario autenticado.
 */
const getAuthenticatedUser = async (req, res, next) => {
  try {
    const administradorId = req.user?.administrador_id;
    if (!administradorId) {
      throw new UnauthorizedError("No se encontró ID de usuario autenticado.");
    }

    const admin = await Administrador.findByPk(administradorId, {
      attributes: [
        "administrador_id",
        "nombre",
        "apellido",
        "email",
        "role",
        "profile_picture_url",
        "receive_email_notifications",
        "receive_sms_notifications",
      ],
    });

    if (!admin) {
      throw new NotFoundError(
        "Administrador no encontrado en la base de datos."
      );
    }

    return res.status(200).json({
      id: admin.administrador_id,
      email: admin.email,
      nombre: admin.nombre,
      apellido: admin.apellido,
      role: admin.role,
      profilePictureUrl: admin.profile_picture_url,
      receive_email_notifications: admin.receive_email_notifications,
      receive_sms_notifications: admin.receive_sms_notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Maneja la solicitud de restablecimiento de contraseña.
 */
const forgotPassword = async (req, res, next) => {
  let administrador;
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    administrador = await Administrador.findOne({ where: { email } });


    if (administrador) {
      const resetToken = administrador.getResetPasswordToken();
      await administrador.save({
        fields: ["resetPasswordToken", "resetPasswordExpires"],
      });

      const resetUrl = `${process.env.FRONTEND_URL}/restablecer-contrasena/${resetToken}`;

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
      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({
      message:
        "Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña.", // Se responde de manera genérica por seguridad.
    });
  } catch (error) {
    // Si falla el envío de correo, revierte el token.
    if (administrador) {
      administrador.resetPasswordToken = null;
      administrador.resetPasswordExpires = null;
      await administrador.save();
    }
    next(error);
  }
};

/**
 * Restablece la contraseña de un administrador utilizando un token.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password_hash } = changePasswordSchema.parse(req.body);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const administrador = await Administrador.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [db.Sequelize.Op.gt]: Date.now() },
      },
    });

    if (!administrador) {
      throw new BadRequestError(
        "Token de restablecimiento inválido o expirado."
      );
    }

    // La contraseña se hashea automáticamente en el hook beforeUpdate.
    administrador.password_hash = password_hash;
    administrador.resetPasswordToken = null;
    administrador.resetPasswordExpires = null;
    await administrador.save();

    res.status(200).json({ message: "Contraseña restablecida exitosamente." });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todos los administradores registrados (solo datos públicos).
 */
const getAllAdministrator = async (req, res, next) => {
  try {
    const admins = await Administrador.findAll({
      attributes: [
        "administrador_id",
        "nombre",
        "apellido",
        "email",
        "role",
        "profile_picture_url",
      ],
    });
    res.status(200).json(admins);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza la información del perfil de un administrador autenticado, incluyendo la foto de perfil.
 */
const updateAdminProfile = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;
    const { nombre, apellido, email } = req.body;
    const profile_picture_url_from_body = req.body.profile_picture_url;

    const admin = await Administrador.findByPk(administradorId);
    if (!admin) {
      throw new NotFoundError("Administrador no encontrado.");
    }

    const validatedData = updateProfileSchema.parse({
      nombre,
      apellido,
      email,
    });

    // Validar unicidad del email si se está actualizando.
    if (validatedData.email && validatedData.email !== admin.email) {
      const existingAdmin = await Administrador.findOne({
        where: {
          email: validatedData.email,
          administrador_id: { [db.Sequelize.Op.ne]: administradorId },
        },
      });
      if (existingAdmin) {
        throw new ConflictError(
          "Este email ya está registrado por otro administrador."
        );
      }
    }

    let newProfilePictureUrl = admin.profile_picture_url;

    if (req.file) {
      // Sube la nueva imagen y elimina la antigua si existe.
      if (admin.profile_picture_url) {
        await deleteFileFromSupabase(admin.profile_picture_url);
      }
      newProfilePictureUrl = await uploadFileToSupabase(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        `admin_profiles/${administradorId}`
      );
    } else if (
      profile_picture_url_from_body === "null" &&
      admin.profile_picture_url
    ) {
      // Si el frontend pide explícitamente borrar la imagen.
      await deleteFileFromSupabase(admin.profile_picture_url);
      newProfilePictureUrl = null;
    }

    await admin.update({
      ...validatedData,
      profile_picture_url: newProfilePictureUrl,
    });

    res.status(200).json({
      message: "Perfil actualizado exitosamente",
      user: {
        id: admin.administrador_id,
        nombre: admin.nombre,
        apellido: admin.apellido,
        email: admin.email,
        role: admin.role,
        profilePictureUrl: newProfilePictureUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permite a un administrador autenticado cambiar su contraseña.
 */
const updateAdminPassword = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;
    const { current_password, new_password } = updatePasswordSchema.parse(
      req.body
    );

    const admin = await Administrador.findByPk(administradorId);
    if (!admin) {
      throw new NotFoundError("Administrador no encontrado.");
    }

    if (!(await comparePassword(current_password, admin.password_hash))) {
      throw new UnauthorizedError("La contraseña actual es incorrecta.");
    }

    // La contraseña se hashea automáticamente en el hook beforeUpdate.
    admin.password_hash = new_password;
    await admin.save();

    res.status(200).json({ message: "Contraseña actualizada exitosamente." });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza las preferencias de notificación de un administrador autenticado.
 */
const updateAdminNotificationPreferences = async (req, res, next) => {
  try {
    const administradorId = req.user.administrador_id;
    const validatedData = updateNotificationPreferencesSchema.parse(req.body);

    const admin = await Administrador.findByPk(administradorId, {
      attributes: [
        "administrador_id",
        "receive_email_notifications",
        "receive_sms_notifications",
      ],
    });
    if (!admin) {
      throw new NotFoundError("Administrador no encontrado.");
    }

    await admin.update(validatedData);

    res.status(200).json({
      message: "Preferencias de notificación actualizadas exitosamente.",
      user: {
        id: admin.administrador_id,
        receive_email_notifications: admin.receive_email_notifications,
        receive_sms_notifications: admin.receive_sms_notifications,
      },
    });
  } catch (error) {
    next(error);
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
  updateAdminProfile,
  updateAdminPassword,
  updateAdminNotificationPreferences,
  upload,
};
