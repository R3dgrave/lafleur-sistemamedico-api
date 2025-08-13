"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date("2025-07-30T00:00:00Z");
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 1. Administradores
    await queryInterface.bulkInsert(
      "Administradores",
      [
        {
          administrador_id: 1,
          nombre: "Admin",
          apellido: "Principal",
          email: "correo@gmail.com",
          password_hash: hashedPassword,
          role: "super_admin",
          profile_picture_url:
            "https://placehold.co/120x120/cccccc/333333?text=Admin",
          receive_email_notifications: true,
          receive_sms_notifications: false,
        },
        {
          administrador_id: 2,
          nombre: "Doctora",
          apellido: "Lopez",
          email: "doctora.lopez@example.com",
          password_hash: await bcrypt.hash("passwordDoc", 10),
          role: "admin",
          profile_picture_url:
            "https://placehold.co/120x120/99ccff/000000?text=Doc",
          receive_email_notifications: true,
          receive_sms_notifications: true,
        },
      ],
      { ignoreDuplicates: true }
    );

    // 2. Pacientes
    await queryInterface.bulkInsert(
      "Pacientes",
      [
        {
          paciente_id: 1,
          nombre: "Paciente Uno",
          apellido: "Apellido Uno",
          fecha_nacimiento: "1990-01-15",
          genero: "Masculino",
          identidad_genero: "Hombre",
          sexo_registral: "Masculino",
          telefono: "+56923456789",
          email: "paciente1@example.com",
          direccion: "Calle Falsa 123",
          rut: "11.111.111-1",
          fecha_registro: today,
        },
        {
          paciente_id: 2,
          nombre: "Paciente Dos",
          apellido: "Apellido Dos",
          fecha_nacimiento: "1985-05-20",
          genero: "Femenino",
          identidad_genero: "Mujer",
          sexo_registral: "Femenino",
          telefono: "+56987654321",
          email: "paciente2@example.com",
          direccion: "Avenida Siempre Viva 742",
          rut: "22.222.222-2",
          fecha_registro: today,
        },
        {
          paciente_id: 3,
          nombre: "Carlos",
          apellido: "Gomez",
          fecha_nacimiento: "1978-11-03",
          genero: "Masculino",
          identidad_genero: "Hombre",
          sexo_registral: "Masculino",
          telefono: "+56955111222",
          email: "carlos.gomez@example.com",
          direccion: "El Bosque 456",
          rut: "33.333.333-3",
          fecha_registro: today,
        },
        {
          paciente_id: 4,
          nombre: "Ana",
          apellido: "Diaz",
          fecha_nacimiento: "1995-03-25",
          genero: "Femenino",
          identidad_genero: "Mujer",
          sexo_registral: "Femenino",
          telefono: "+56955333444",
          email: "ana.diaz@example.com",
          direccion: "Los Pinos 789",
          rut: "44.444.444-4",
          fecha_registro: today,
        },
        {
          paciente_id: 5,
          nombre: "Luis",
          apellido: "Mora",
          fecha_nacimiento: "2000-07-01",
          genero: "No Binario",
          identidad_genero: "Género Fluido",
          sexo_registral: "Masculino",
          telefono: "+56955555666",
          email: "luis.mora@example.com",
          direccion: "Calle Central 101",
          rut: "55.555.555-5",
          fecha_registro: today,
        },
      ],
      { ignoreDuplicates: true }
    );

    // 3. Tipo_Atencion (Mantener existentes)
    await queryInterface.bulkInsert(
      "Tipo_Atencion",
      [
        {
          tipo_atencion_id: 1,
          nombre_atencion: "Consulta General",
          duracion_minutos: 60,
          buffer_minutos: 30,
        },
        {
          tipo_atencion_id: 2,
          nombre_atencion: "Matrona",
          duracion_minutos: 60,
          buffer_minutos: 30,
        },
        {
          tipo_atencion_id: 3,
          nombre_atencion: "Obstetricia",
          duracion_minutos: 60,
          buffer_minutos: 30,
        },
        {
          tipo_atencion_id: 4,
          nombre_atencion: "Estetica",
          duracion_minutos: 60,
          buffer_minutos: 30,
        },
        {
          tipo_atencion_id: 5,
          nombre_atencion: "Control de Diabetes",
          duracion_minutos: 45,
          buffer_minutos: 15,
        },
        {
          tipo_atencion_id: 6,
          nombre_atencion: "Control de Hipertensión",
          duracion_minutos: 45,
          buffer_minutos: 15,
        },
      ],
      { ignoreDuplicates: true }
    );

    // 4. Horarios_Disponibles (Mantener existentes)
    const horarios = [
      {
        administrador_id: 1,
        dia_semana: 1,
        hora_inicio: "09:00:00",
        hora_fin: "17:00:00",
      }, // Lunes
      {
        administrador_id: 1,
        dia_semana: 2,
        hora_inicio: "09:00:00",
        hora_fin: "17:00:00",
      }, // Martes
      {
        administrador_id: 1,
        dia_semana: 3,
        hora_inicio: "09:00:00",
        hora_fin: "17:00:00",
      }, // Miércoles
      {
        administrador_id: 1,
        dia_semana: 4,
        hora_inicio: "09:00:00",
        hora_fin: "17:00:00",
      }, // Jueves
      {
        administrador_id: 1,
        dia_semana: 5,
        hora_inicio: "09:00:00",
        hora_fin: "17:00:00",
      }, // Viernes
      {
        administrador_id: 2,
        dia_semana: 1,
        hora_inicio: "10:00:00",
        hora_fin: "18:00:00",
      }, // Lunes Doc Lopez
      {
        administrador_id: 2,
        dia_semana: 3,
        hora_inicio: "10:00:00",
        hora_fin: "18:00:00",
      }, // Miércoles Doc Lopez
    ];
    await queryInterface.bulkInsert("Horarios_Disponibles", horarios, {
      ignoreDuplicates: true,
    });

    // 5. Excepciones_Disponibilidad (Mantener existentes)
    const excepciones = [
      {
        administrador_id: 1,
        fecha: "2025-12-25",
        es_dia_completo: true,
        descripcion: "Feriado de Navidad",
      },
      {
        administrador_id: 1,
        fecha: "2025-09-18",
        es_dia_completo: true,
        descripcion: "Feriado Nacional",
      },
      {
        administrador_id: 1,
        fecha: "2025-07-30",
        hora_inicio_bloqueo: "13:00:00",
        hora_fin_bloqueo: "14:00:00",
        es_dia_completo: false,
        descripcion: "Almuerzo",
      },
      {
        administrador_id: 2,
        fecha: "2025-08-15",
        es_dia_completo: true,
        descripcion: "Vacaciones Dra. Lopez",
      },
    ];
    await queryInterface.bulkInsert("Excepciones_Disponibilidad", excepciones, {
      ignoreDuplicates: true,
    });

    // 6. Citas (Más citas, con fechas variadas y estados)
    await queryInterface.bulkInsert(
      "Citas",
      [
        {
          cita_id: 1,
          paciente_id: 1,
          tipo_atencion_id: 1,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 5,
            10,
            0
          ), // Hace 5 días
          estado_cita: "Completada",
          notas: "Cita inicial. Paciente con buen estado general.",
          fecha_creacion: today,
          administrador_id: 1,
        },
        {
          cita_id: 2,
          paciente_id: 1,
          tipo_atencion_id: 5,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 2,
            11,
            0
          ), // Hace 2 días
          estado_cita: "Confirmada",
          notas: "Control de diabetes. Ajuste de medicación.",
          fecha_creacion: today,
          administrador_id: 1,
        },
        {
          cita_id: 3,
          paciente_id: 2,
          tipo_atencion_id: 1,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 10,
            14,
            0
          ), // Hace 10 días
          estado_cita: "Completada",
          notas: "Revisión anual. Todo en orden.",
          fecha_creacion: today,
          administrador_id: 1,
        },
        {
          cita_id: 4,
          paciente_id: 3,
          tipo_atencion_id: 6,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 3,
            9,
            30
          ), // En 3 días
          estado_cita: "Pendiente",
          notas: "Primera consulta por hipertensión. Paciente derivado.",
          fecha_creacion: today,
          administrador_id: 2,
        },
        {
          cita_id: 5,
          paciente_id: 4,
          tipo_atencion_id: 4,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 7,
            16,
            0
          ), // En 7 días
          estado_cita: "Pendiente",
          notas: "Sesión de seguimiento estética.",
          fecha_creacion: today,
          administrador_id: 1,
        },
        {
          cita_id: 6,
          paciente_id: 1,
          tipo_atencion_id: 5,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 15,
            9,
            0
          ), // En 15 días
          estado_cita: "Pendiente",
          notas: "Próximo control de diabetes.",
          fecha_creacion: today,
          administrador_id: 1,
        },
        {
          cita_id: 7,
          paciente_id: 2,
          tipo_atencion_id: 2,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 20,
            10,
            0
          ), // En 20 días
          estado_cita: "Pendiente",
          notas: "Control prenatal.",
          fecha_creacion: today,
          administrador_id: 1,
        },
        {
          cita_id: 8,
          paciente_id: 3,
          tipo_atencion_id: 6,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1,
            15,
            0
          ), // Ayer
          estado_cita: "Confirmada",
          notas: "Control de presión arterial. Paciente con medicación.",
          fecha_creacion: today,
          administrador_id: 2,
        },
        {
          cita_id: 9,
          paciente_id: 4,
          tipo_atencion_id: 1,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
            11,
            0
          ), // Mañana
          estado_cita: "Pendiente",
          notas: "Consulta por chequeo general.",
          fecha_creacion: today,
          administrador_id: 1,
        },
        {
          cita_id: 10,
          paciente_id: 5,
          tipo_atencion_id: 1,
          fecha_hora_cita: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 7,
            9,
            0
          ), // Hace 7 días
          estado_cita: "Completada",
          notas: "Primera consulta. Anamnesis completa.",
          fecha_creacion: today,
          administrador_id: 1,
        },
      ],
      { ignoreDuplicates: true }
    );

    // 7. Contactos_Emergencia
    await queryInterface.bulkInsert(
      "Contactos_Emergencia",
      [
        {
          paciente_id: 1,
          nombre_contacto: "Familiar Paciente Uno",
          telefono_contacto: "+56911222333",
          relacion_paciente: "Hermano",
          fecha_registro: today,
        },
        {
          paciente_id: 2,
          nombre_contacto: "Pareja Paciente Dos",
          telefono_contacto: "+56958741236",
          relacion_paciente: "Cónyuge",
          fecha_registro: today,
        },
        {
          paciente_id: 3,
          nombre_contacto: "Hijo Carlos",
          telefono_contacto: "+56948574626",
          relacion_paciente: "Hijo",
          fecha_registro: today,
        },
        {
          paciente_id: 4,
          nombre_contacto: "Madre Ana",
          telefono_contacto: "+56947584737",
          relacion_paciente: "Madre",
          fecha_registro: today,
        },
      ],
      { ignoreDuplicates: true }
    );

    // 8. Historia_Clinica (Asegúrate de que existan para cada paciente antes de los demás registros)
    await queryInterface.bulkInsert(
      "Historia_Clinica",
      [
        {
          historia_clinica_id: 1,
          paciente_id: 1,
          fecha_creacion: today,
          ultima_actualizacion: today,
        },
        {
          historia_clinica_id: 2,
          paciente_id: 2,
          fecha_creacion: today,
          ultima_actualizacion: today,
        },
        {
          historia_clinica_id: 3,
          paciente_id: 3,
          fecha_creacion: today,
          ultima_actualizacion: today,
        },
        {
          historia_clinica_id: 4,
          paciente_id: 4,
          fecha_creacion: today,
          ultima_actualizacion: today,
        },
        {
          historia_clinica_id: 5,
          paciente_id: 5,
          fecha_creacion: today,
          ultima_actualizacion: today,
        },
      ],
      { ignoreDuplicates: true }
    );

    // 9. Anamnesis
    await queryInterface.bulkInsert(
      "Anamnesis",
      [
        {
          historia_clinica_id: 1,
          cita_id: 1,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 5,
            10,
            15
          ),
          motivo_consulta: "Dolor de cabeza persistente.",
          antecedentes_personales: "Migrañas ocasionales en la adolescencia.",
          medicamentos_actuales: "Ninguno.",
          alergias: "Polen.",
          habitos_tabaco: false,
          habitos_alcohol: true,
          habitos_alimentacion: "Balanceada.",
        },
        {
          historia_clinica_id: 1,
          cita_id: 2,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 2,
            11,
            10
          ),
          motivo_consulta: "Seguimiento de diabetes tipo 2.",
          antecedentes_personales: "Diagnóstico hace 5 años.",
          medicamentos_actuales: "Metformina 500mg.",
          alergias: "Ninguna conocida.",
          aqx: "Apendicectomía (2010).",
          amp: "Hipertensión controlada.",
          habitos_tabaco: false,
          habitos_alcohol: false,
          habitos_alimentacion: "Dieta controlada.",
        },
        {
          historia_clinica_id: 2,
          cita_id: 3,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 10,
            14,
            10
          ),
          motivo_consulta: "Chequeo ginecológico anual.",
          antecedentes_familiares: "Madre con osteoporosis.",
          medicamentos_actuales: "Anticonceptivos orales.",
          alergias: "Penicilina.",
          habitos_tabaco: false,
          habitos_alcohol: false,
          habitos_alimentacion: "Vegetariana.",
        },
        {
          historia_clinica_id: 3,
          cita_id: 8,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1,
            15,
            10
          ),
          motivo_consulta: "Control de hipertensión.",
          antecedentes_personales: "Diagnóstico reciente.",
          medicamentos_actuales: "Losartán 50mg.",
          alergias: "Ninguna.",
          habitos_tabaco: true,
          habitos_alcohol: true,
          habitos_alimentacion: "Normal.",
        },
        {
          historia_clinica_id: 5,
          cita_id: 10,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 7,
            9,
            15
          ),
          motivo_consulta: "Consulta de primera vez. Ansiedad.",
          antecedentes_personales: "Historial de estrés laboral.",
          medicamentos_actuales: "Suplementos vitamínicos.",
          alergias: "Ninguna.",
          habitos_tabaco: false,
          habitos_alcohol: false,
          habitos_alimentacion: "Irregular.",
        },
      ],
      { ignoreDuplicates: true }
    );

    // 10. Exploracion_Fisica
    await queryInterface.bulkInsert(
      "Exploracion_Fisica",
      [
        {
          historia_clinica_id: 1,
          cita_id: 1,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 5,
            10,
            30
          ),
          region_explorada: "Cabeza y Cuello",
          hallazgos:
            "Sin hallazgos patológicos relevantes. Palpación de cuello normal.",
        },
        {
          historia_clinica_id: 1,
          cita_id: 2,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 2,
            11,
            30
          ),
          region_explorada: "Abdomen y Extremidades",
          hallazgos:
            "Abdomen blando, depresible, no doloroso. Pulsos periféricos presentes. Edema leve en tobillos.",
        },
        {
          historia_clinica_id: 2,
          cita_id: 3,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 10,
            14,
            30
          ),
          region_explorada: "Ginecológica",
          hallazgos: "Examen bimanual y especular normal. Citología tomada.",
        },
        {
          historia_clinica_id: 3,
          cita_id: 8,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1,
            15,
            30
          ),
          region_explorada: "Cardiovascular y Pulmonar",
          hallazgos:
            "Ruidos cardíacos rítmicos, sin soplos. Campos pulmonares limpios, buena entrada de aire.",
        },
        {
          historia_clinica_id: 5,
          cita_id: 10,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 7,
            9,
            30
          ),
          region_explorada: "General",
          hallazgos:
            "Paciente consciente, orientado. Piel y mucosas hidratadas. Sin signos de deshidratación.",
        },
      ],
      { ignoreDuplicates: true }
    );

    // 11. Diagnosticos
    await queryInterface.bulkInsert(
      "Diagnosticos",
      [
        {
          historia_clinica_id: 1,
          cita_id: 1,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 5,
            10,
            45
          ),
          codigo_cie: "G43.9",
          nombre_diagnostico: "Migraña no especificada",
          descripcion: "Episodios recurrentes de cefalea.",
          es_principal: true,
          estado_diagnostico: "Activo",
        },
        {
          historia_clinica_id: 1,
          cita_id: 2,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 2,
            11,
            45
          ),
          codigo_cie: "E11.9",
          nombre_diagnostico: "Diabetes Mellitus Tipo 2 no especificada",
          descripcion: "Control metabólico en curso.",
          es_principal: true,
          estado_diagnostico: "Crónico",
        },
        {
          historia_clinica_id: 2,
          cita_id: 3,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 10,
            14,
            45
          ),
          codigo_cie: "Z01.4",
          nombre_diagnostico: "Examen ginecológico general",
          descripcion: "Chequeo anual de rutina.",
          es_principal: true,
          estado_diagnostico: "Resuelto",
        },
        {
          historia_clinica_id: 3,
          cita_id: 8,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1,
            15,
            45
          ),
          codigo_cie: "I10",
          nombre_diagnostico: "Hipertensión esencial (primaria)",
          descripcion: "Presión arterial elevada, en tratamiento.",
          es_principal: true,
          estado_diagnostico: "Crónico",
        },
        {
          historia_clinica_id: 5,
          cita_id: 10,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 7,
            9,
            45
          ),
          codigo_cie: "F41.1",
          nombre_diagnostico: "Trastorno de ansiedad generalizada",
          descripcion: "Ansiedad excesiva y preocupación crónica.",
          es_principal: true,
          estado_diagnostico: "Activo",
        },
      ],
      { ignoreDuplicates: true }
    );

    // 12. Plan_Tratamiento
    await queryInterface.bulkInsert(
      "Plan_Tratamiento",
      [
        {
          historia_clinica_id: 1,
          cita_id: 1,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 5,
            11,
            0
          ),
          descripcion_plan:
            "Manejo de migraña. Evitar desencadenantes conocidos.",
          medicamentos_recetados: "Ibuprofeno 400mg PRN.",
          indicaciones_adicionales: "Descanso en ambiente oscuro y tranquilo.",
          proxima_cita_recomendada: new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate() + 15
          )
            .toISOString()
            .split("T")[0], // En 1 mes y 15 días
          receta_adjunta_url: "https://ejemplo.com/receta-migrana-p1.pdf",
        },
        {
          historia_clinica_id: 1,
          cita_id: 2,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 2,
            12,
            0
          ),
          descripcion_plan:
            "Ajuste de medicación para diabetes. Control de glucemia.",
          medicamentos_recetados: "Metformina 850mg c/12h.",
          indicaciones_adicionales:
            "Dieta hipocalórica, ejercicio moderado 30 min/día.",
          proxima_cita_recomendada: new Date(
            today.getFullYear(),
            today.getMonth() + 2,
            today.getDate()
          )
            .toISOString()
            .split("T")[0], // En 2 meses
          receta_adjunta_url: null,
        },
        {
          historia_clinica_id: 3,
          cita_id: 8,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1,
            16,
            0
          ),
          descripcion_plan:
            "Control de hipertensión. Monitoreo domiciliario de PA.",
          medicamentos_recetados: "Losartán 50mg OD.",
          indicaciones_adicionales:
            "Reducir ingesta de sodio, caminata diaria.",
          proxima_cita_recomendada: new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate() + 7
          )
            .toISOString()
            .split("T")[0], // En 1 mes y 7 días
          receta_adjunta_url:
            "https://ejemplo.com/receta-hipertension-carlos.pdf",
        },
        {
          historia_clinica_id: 4,
          cita_id: 5,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 7,
            16,
            30
          ), // Fecha futura, después de la cita
          descripcion_plan:
            "Plan de tratamiento para acné severo. Inicio de isotretinoína.",
          medicamentos_recetados: "Isotretinoína 20mg OD.",
          indicaciones_adicionales:
            "Hidratación constante, protección solar estricta. Control mensual.",
          proxima_cita_recomendada: new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate() + 7
          )
            .toISOString()
            .split("T")[0], // En 1 mes y 7 días
          receta_adjunta_url: "https://ejemplo.com/receta-acne-ana.pdf",
        },
        {
          historia_clinica_id: 5,
          cita_id: 10,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 7,
            10,
            0
          ),
          descripcion_plan:
            "Manejo inicial de ansiedad. Terapia cognitivo-conductual.",
          medicamentos_recetados: "Ninguno por el momento.",
          indicaciones_adicionales:
            "Técnicas de relajación, mindfulness. Considerar derivación a psicólogo.",
          proxima_cita_recomendada: new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate()
          )
            .toISOString()
            .split("T")[0], // En 1 mes
          receta_adjunta_url: null,
        },
      ],
      { ignoreDuplicates: true }
    );

    // 13. Pruebas_Iniciales
    await queryInterface.bulkInsert(
      "Pruebas_Iniciales",
      [
        {
          historia_clinica_id: 1,
          cita_id: 1,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 6,
            9,
            0
          ),
          peso: 75.5,
          altura: 1.75,
          imc: 24.69,
          perimetro_cintura: 85.0,
          perimetro_cadera: 95.0,
          presion_sistolica: 120,
          presion_diastolica: 80,
          frecuencia_cardiaca: 72,
          temperatura: 36.8,
          saturacion_oxigeno: 98.5,
          notas_adicionales: "Primer control general.",
        },
        {
          historia_clinica_id: 2,
          cita_id: 2,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 11,
            13,
            0
          ),
          peso: 62.0,
          altura: 1.63,
          imc: 23.36,
          perimetro_cintura: 78.0,
          perimetro_cadera: 90.0,
          presion_sistolica: 110,
          presion_diastolica: 70,
          frecuencia_cardiaca: 68,
          temperatura: 37.0,
          saturacion_oxigeno: 99.0,
          notas_adicionales: "Control anual.",
        },
        {
          historia_clinica_id: 3,
          cita_id: 8,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 2,
            14,
            0
          ),
          peso: 90.1,
          altura: 1.8,
          imc: 27.81,
          perimetro_cintura: 100.0,
          perimetro_cadera: 105.0,
          presion_sistolica: 145,
          presion_diastolica: 95,
          frecuencia_cardiaca: 85,
          temperatura: 36.5,
          saturacion_oxigeno: 97.0,
          notas_adicionales:
            "Valores iniciales para tratamiento de hipertensión.",
        },
        {
          historia_clinica_id: 4,
          cita_id: 5,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 6,
            10,
            0
          ), // Fecha futura
          peso: 58.0,
          altura: 1.68,
          imc: 20.53,
          perimetro_cintura: 70.0,
          perimetro_cadera: 88.0,
          presion_sistolica: 115,
          presion_diastolica: 75,
          frecuencia_cardiaca: 70,
          temperatura: 36.9,
          saturacion_oxigeno: 98.0,
          notas_adicionales: "Evaluación pre-tratamiento estético.",
        },
        {
          historia_clinica_id: 5,
          cita_id: 10,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 8,
            8,
            30
          ),
          peso: 68.0,
          altura: 1.7,
          imc: 23.53,
          perimetro_cintura: 80.0,
          perimetro_cadera: 92.0,
          presion_sistolica: 125,
          presion_diastolica: 82,
          frecuencia_cardiaca: 75,
          temperatura: 37.1,
          saturacion_oxigeno: 98.8,
          notas_adicionales: "Evaluación inicial de salud.",
        },
        // Nuevos registros para citas futuras
        {
          historia_clinica_id: 3,
          cita_id: 4,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 2,
            8,
            30
          ), // Un día antes de la cita
          peso: 89.5,
          altura: 1.8,
          imc: 27.62,
          perimetro_cintura: 99.0,
          perimetro_cadera: 104.0,
          presion_sistolica: 140,
          presion_diastolica: 90,
          frecuencia_cardiaca: 80,
          temperatura: 36.6,
          saturacion_oxigeno: 97.5,
          notas_adicionales:
            "Chequeo pre-consulta de seguimiento de hipertensión.",
        },
        {
          historia_clinica_id: 1,
          cita_id: 6,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 14,
            8,
            0
          ), // Un día antes de la cita
          peso: 75.0,
          altura: 1.75,
          imc: 24.53,
          perimetro_cintura: 84.0,
          perimetro_cadera: 94.0,
          presion_sistolica: 118,
          presion_diastolica: 78,
          frecuencia_cardiaca: 70,
          temperatura: 36.7,
          saturacion_oxigeno: 98.0,
          notas_adicionales: "Valores previos al control de diabetes.",
        },
        {
          historia_clinica_id: 2,
          cita_id: 7,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 19,
            9,
            0
          ),
          peso: 63.5,
          altura: 1.63,
          imc: 23.93,
          perimetro_cintura: 80.0,
          perimetro_cadera: 92.0,
          presion_sistolica: 125,
          presion_diastolica: 85,
          frecuencia_cardiaca: 88,
          temperatura: 37.2,
          saturacion_oxigeno: 98.9,
          notas_adicionales: "Mediciones para control prenatal.",
        },
        {
          historia_clinica_id: 4,
          cita_id: 9,
          fecha_registro: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
            10,
            30
          ),
          peso: 58.2,
          altura: 1.68,
          imc: 20.6,
          perimetro_cintura: 70.5,
          perimetro_cadera: 88.5,
          presion_sistolica: 116,
          presion_diastolica: 76,
          frecuencia_cardiaca: 71,
          temperatura: 37.0,
          saturacion_oxigeno: 98.7,
          notas_adicionales: "Chequeo inicial para consulta general.",
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, Sequelize) {
    // El orden de eliminación en `down` debe ser el inverso al de inserción para respetar FKs
    await queryInterface.bulkDelete("Pruebas_Iniciales", null, {});
    await queryInterface.bulkDelete("Plan_Tratamiento", null, {});
    await queryInterface.bulkDelete("Diagnosticos", null, {});
    await queryInterface.bulkDelete("Exploracion_Fisica", null, {});
    await queryInterface.bulkDelete("Anamnesis", null, {});
    await queryInterface.bulkDelete("Historia_Clinica", null, {});
    await queryInterface.bulkDelete("Contactos_Emergencia", null, {});
    await queryInterface.bulkDelete("Citas", null, {});
    await queryInterface.bulkDelete("Excepciones_Disponibilidad", null, {});
    await queryInterface.bulkDelete("Horarios_Disponibles", null, {});
    await queryInterface.bulkDelete("Tipo_Atencion", null, {});
    await queryInterface.bulkDelete("Pacientes", null, {});
    await queryInterface.bulkDelete("Administradores", null, {});
  },
};
