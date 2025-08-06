"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Administradores", {
      administrador_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      apellido: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "admin",
      },
      profile_picture_url: { type: Sequelize.STRING(255), allowNull: true },
      receive_email_notifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      receive_sms_notifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      resetPasswordToken: { type: Sequelize.STRING(255), allowNull: true },
      resetPasswordExpires: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable("Pacientes", {
      paciente_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      apellido: { type: Sequelize.STRING(100), allowNull: false },
      fecha_nacimiento: { type: Sequelize.DATEONLY, allowNull: false },
      genero: { type: Sequelize.STRING(10), allowNull: false },
      identidad_genero: { type: Sequelize.STRING(50) },
      sexo_registral: { type: Sequelize.STRING(20) },
      telefono: { type: Sequelize.STRING(20) },
      email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      direccion: { type: Sequelize.STRING(255) },
      rut: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("Tipo_Atencion", {
      tipo_atencion_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre_atencion: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      duracion_minutos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      buffer_minutos: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    });

    await queryInterface.createTable("Horarios_Disponibles", {
      horario_disponible_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      administrador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Administradores", key: "administrador_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      dia_semana: { type: Sequelize.INTEGER, allowNull: false },
      hora_inicio: { type: Sequelize.TIME, allowNull: false },
      hora_fin: { type: Sequelize.TIME, allowNull: false },
    });

    await queryInterface.addIndex(
      "Horarios_Disponibles",
      ["administrador_id", "dia_semana", "hora_inicio", "hora_fin"],
      { unique: true, name: "unique_horario_administrador_dia_hora" }
    );

    await queryInterface.createTable("Excepciones_Disponibilidad", {
      excepcion_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      administrador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Administradores", key: "administrador_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      hora_inicio_bloqueo: { type: Sequelize.TIME },
      hora_fin_bloqueo: { type: Sequelize.TIME },
      es_dia_completo: { type: Sequelize.BOOLEAN, defaultValue: false },
      descripcion: { type: Sequelize.STRING(255) },
    });

    await queryInterface.createTable("Contactos_Emergencia", {
      contacto_emergencia_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      paciente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Pacientes", key: "paciente_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      nombre_contacto: { type: Sequelize.STRING(100), allowNull: false },
      telefono_contacto: { type: Sequelize.STRING(20), allowNull: false },
      relacion_paciente: { type: Sequelize.STRING(50) },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("Citas", {
      cita_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      paciente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Pacientes", key: "paciente_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tipo_atencion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Tipo_Atencion", key: "tipo_atencion_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      administrador_id: {
        type: Sequelize.INTEGER,
        references: { model: "Administradores", key: "administrador_id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true,
      },
      fecha_hora_cita: { type: Sequelize.DATE, allowNull: false },
      estado_cita: {
        type: Sequelize.STRING(50),
        defaultValue: "Pendiente",
        allowNull: false,
      },
      notas: { type: Sequelize.TEXT },
      fecha_creacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Crear índices únicos después de crear la tabla**
    await queryInterface.addIndex(
      "Citas",
      ["fecha_hora_cita", "administrador_id"],
      {
        unique: true,
        name: "unique_cita_admin_time",
      }
    );

    await queryInterface.addIndex("Citas", ["fecha_hora_cita", "paciente_id"], {
      unique: true,
      name: "unique_cita_patient_time",
    });

    // --- (HISTORIA CLÍNICA) ---

    await queryInterface.createTable("Historia_Clinica", {
      historia_clinica_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      paciente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "Pacientes", key: "paciente_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      ultima_actualizacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("Pruebas_Iniciales", {
      prueba_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      historia_clinica_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Historia_Clinica", key: "historia_clinica_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cita_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Citas", key: "cita_id" },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      peso: { type: Sequelize.DECIMAL(5, 2) },
      altura: { type: Sequelize.DECIMAL(4, 2) },
      imc: { type: Sequelize.DECIMAL(4, 2) },
      perimetro_cintura: { type: Sequelize.DECIMAL(5, 2) },
      perimetro_cadera: { type: Sequelize.DECIMAL(5, 2) },
      presion_sistolica: { type: Sequelize.INTEGER },
      presion_diastolica: { type: Sequelize.INTEGER },
      frecuencia_cardiaca: { type: Sequelize.INTEGER },
      temperatura: { type: Sequelize.DECIMAL(3, 1) },
      saturacion_oxigeno: { type: Sequelize.DECIMAL(4, 2) },
      notas_adicionales: { type: Sequelize.TEXT },
    });

    await queryInterface.createTable("Anamnesis", {
      anamnesis_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      historia_clinica_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Historia_Clinica", key: "historia_clinica_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cita_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Citas", key: "cita_id" },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      motivo_consulta: { type: Sequelize.TEXT },
      antecedentes_personales: { type: Sequelize.TEXT },
      antecedentes_familiares: { type: Sequelize.TEXT },
      medicamentos_actuales: { type: Sequelize.TEXT },
      alergias: { type: Sequelize.TEXT },
      otros_antecedentes: { type: Sequelize.TEXT },
      aqx: { type: Sequelize.TEXT },
      amp: { type: Sequelize.TEXT },
      habitos_tabaco: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      habitos_alcohol: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      habitos_alimentacion: { type: Sequelize.TEXT },
    });

    await queryInterface.createTable("Exploracion_Fisica", {
      exploracion_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      historia_clinica_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Historia_Clinica", key: "historia_clinica_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cita_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Citas", key: "cita_id" },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      hallazgos: { type: Sequelize.TEXT },
      region_explorada: { type: Sequelize.STRING(100) },
    });

    await queryInterface.createTable("Diagnosticos", {
      diagnostico_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      historia_clinica_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Historia_Clinica", key: "historia_clinica_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cita_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Citas", key: "cita_id" },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      codigo_cie: { type: Sequelize.STRING(20), allowNull: true },
      nombre_diagnostico: { type: Sequelize.STRING(255), allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      es_principal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      estado_diagnostico: {
        type: Sequelize.ENUM("Activo", "Resuelto", "Crónico", "Inactivo"),
        allowNull: false,
        defaultValue: "Activo",
      },
    });

    await queryInterface.createTable("Plan_Tratamiento", {
      plan_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      historia_clinica_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Historia_Clinica", key: "historia_clinica_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cita_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Citas", key: "cita_id" },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      descripcion_plan: { type: Sequelize.TEXT, allowNull: false },
      medicamentos_recetados: { type: Sequelize.TEXT },
      indicaciones_adicionales: { type: Sequelize.TEXT },
      proxima_cita_recomendada: { type: Sequelize.DATEONLY },
      receta_adjunta_url: { type: Sequelize.STRING(255) },
    });
  },

  async down(queryInterface, Sequelize) {
    // El orden en 'down' debe ser el inverso de 'up'

    await queryInterface.removeIndex("Citas", "unique_cita_admin_time");
    await queryInterface.removeIndex("Citas", "unique_cita_patient_time");

    // --- ELIMINAR NUEVAS TABLAS (HISTORIA CLÍNICA) ---
    await queryInterface.dropTable("Plan_Tratamiento");
    await queryInterface.dropTable("Diagnosticos");
    await queryInterface.dropTable("Exploracion_Fisica");
    await queryInterface.dropTable("Anamnesis");
    await queryInterface.dropTable("Pruebas_Iniciales");
    await queryInterface.dropTable("Historia_Clinica");

    // --- ELIMINAR TABLAS ORIGINALES ---
    await queryInterface.dropTable("Citas");
    await queryInterface.dropTable("Contactos_Emergencia");
    await queryInterface.dropTable("Excepciones_Disponibilidad");
    await queryInterface.removeIndex(
      "Horarios_Disponibles",
      "unique_horario_administrador_dia_hora"
    );
    await queryInterface.dropTable("Horarios_Disponibles");
    await queryInterface.dropTable("Tipo_Atencion");
    await queryInterface.dropTable("Pacientes");
    await queryInterface.dropTable("Administradores");
  },
};
