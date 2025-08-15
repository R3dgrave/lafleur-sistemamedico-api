'use strict';
const bcrypt = require("bcryptjs");
// Importamos las funciones de date-fns para verificar y modificar fechas
const { isSaturday, isSunday, addDays } = require('date-fns');

// ------------------
// Función de ayuda para corregir fechas de fin de semana
// ------------------
/**
 * @param {Date} date - La fecha a verificar.
 * @returns {Date} El próximo día hábil.
 */
function getNextWorkingDay(date) {
  let nextDay = new Date(date);
  while (isSaturday(nextDay) || isSunday(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // Definimos la fecha de hoy de forma dinámica para que el script siempre funcione.
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Opcional: para asegurar que la fecha sea siempre el inicio del día.

    // ------------------
    // Funciones de ayuda para generar fechas y horas
    // ------------------

    /**
     * @param {number} daysOffset - Número de días a sumar o restar (ej: -3 para hace 3 días, 4 para en 4 días).
     * @param {number} hours - Hora del día (0-23).
     * @param {number} minutes - Minutos (0-59).
     * @returns {Date} Una nueva fecha ajustada.
     */
    const createDate = (daysOffset, hours, minutes) => {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + daysOffset);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate;
    };

    /**
     * Genera un array de objetos para las excepciones de almuerzo para todos los administradores.
     * @param {number[]} adminIds - Array de IDs de los administradores.
     * @param {number} daysToGenerate - Número de días futuros para generar la excepción.
     * @returns {Array} Un array de objetos de excepción.
     */
    const generateLunchExceptions = (adminIds, daysToGenerate) => {
      const exceptions = [];
      for (const adminId of adminIds) {
        for (let i = 0; i < daysToGenerate; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          // Omitir fines de semana (sábado = 6, domingo = 0)
          if (date.getDay() !== 0 && date.getDay() !== 6) {
            exceptions.push({
              administrador_id: adminId,
              fecha: date.toISOString().split("T")[0],
              hora_inicio_bloqueo: "13:00:00",
              hora_fin_bloqueo: "14:00:00",
              es_dia_completo: false,
              descripcion: "Almuerzo",
            });
          }
        }
      }
      return exceptions;
    };

    const hashedPassword = await bcrypt.hash("123456", 10);
    const passwordDoctor = await bcrypt.hash("passwordDoc", 10);

    // 1. Administradores
    const administradores = [
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
        password_hash: passwordDoctor,
        role: "admin",
        profile_picture_url:
          "https://placehold.co/120x120/99ccff/000000?text=Doc",
        receive_email_notifications: true,
        receive_sms_notifications: true,
      },
    ];
    await queryInterface.bulkInsert("Administradores", administradores, {
      ignoreDuplicates: true,
    });

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

    // 3. Tipo_Atencion
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
          duracion_minutos: 60,
          buffer_minutos: 30,
        },
        {
          tipo_atencion_id: 6,
          nombre_atencion: "Control de Hipertensión",
          duracion_minutos: 60,
          buffer_minutos: 30,
        },
      ],
      { ignoreDuplicates: true }
    );

    // 4. Horarios_Disponibles
    const horarios = [];
    const weekdays = [1, 2, 3, 4, 5]; // Lunes a Viernes

    // Generar horario de 09:00 a 18:00 para todos los administradores en días de semana
    for (const admin of administradores) {
      for (const day of weekdays) {
        horarios.push({
          administrador_id: admin.administrador_id,
          dia_semana: day,
          hora_inicio: "09:00:00",
          hora_fin: "18:00:00",
        });
      }
    }
    await queryInterface.bulkInsert("Horarios_Disponibles", horarios, {
      ignoreDuplicates: true,
    });

    // 5. Excepciones_Disponibilidad
    // Generamos las excepciones de almuerzo para los próximos 7 días laborales para ambos administradores.
    const excepciones = generateLunchExceptions(
      administradores.map((a) => a.administrador_id),
      7
    );

    // Añadir otras excepciones estáticas para más variedad
    excepciones.push(
      {
        administrador_id: 1,
        fecha: createDate(
          today.getFullYear(),
          today.getMonth(),
          18
        ).toISOString().split("T")[0],
        es_dia_completo: true,
        descripcion: "Feriado Nacional",
      },
      {
        administrador_id: 2,
        fecha: createDate(
          today.getFullYear(),
          today.getMonth() + 1,
          10
        ).toISOString().split("T")[0],
        es_dia_completo: true,
        descripcion: "Vacaciones Dra. Lopez",
      }
    );

    await queryInterface.bulkInsert("Excepciones_Disponibilidad", excepciones, {
      ignoreDuplicates: true,
    });

    // 6. Citas (Más citas, con fechas variadas y estados)
    const rawAppointments = [
      {
        // Cita en el pasado, completada (hace 5 días)
        cita_id: 1,
        paciente_id: 1,
        tipo_atencion_id: 1,
        fecha_hora_cita: createDate(-5, 10, 30),
        estado_cita: "Completada",
        notas: "Revisión anual de Paciente Uno.",
        fecha_creacion: createDate(-6, 9, 0),
        administrador_id: 1,
      },
      {
        // Cita cancelada en el pasado (hace 3 días)
        cita_id: 2,
        paciente_id: 2,
        tipo_atencion_id: 2,
        fecha_hora_cita: createDate(-3, 15, 0),
        estado_cita: "Cancelada",
        notas: "Cita cancelada por el paciente.",
        fecha_creacion: createDate(-4, 11, 0),
        administrador_id: 2,
      },
      {
        // Cita en el pasado, completada (hace 1 día)
        cita_id: 3,
        paciente_id: 3,
        tipo_atencion_id: 6,
        fecha_hora_cita: createDate(-1, 9, 0),
        estado_cita: "Completada",
        notas: "Primera consulta por hipertensión. Paciente derivado.",
        fecha_creacion: createDate(-2, 14, 30),
        administrador_id: 2,
      },
      {
        // Cita confirmada para el futuro (en 2 días)
        cita_id: 4,
        paciente_id: 4,
        tipo_atencion_id: 4,
        fecha_hora_cita: createDate(2, 11, 0),
        estado_cita: "Confirmada",
        notas: "Sesión de seguimiento estética.",
        fecha_creacion: createDate(0, 16, 0),
        administrador_id: 1,
      },
      {
        // Cita pendiente para el futuro (en 4 días)
        cita_id: 5,
        paciente_id: 5,
        tipo_atencion_id: 1,
        fecha_hora_cita: createDate(4, 15, 30),
        estado_cita: "Pendiente",
        notas: "Consulta de seguimiento.",
        fecha_creacion: createDate(2, 8, 0),
        administrador_id: 2,
      },
      {
        // Cita confirmada para el futuro (en 7 días)
        cita_id: 6,
        paciente_id: 1,
        tipo_atencion_id: 3,
        fecha_hora_cita: createDate(7, 10, 0),
        estado_cita: "Confirmada",
        notas: "Cita de obstetricia.",
        fecha_creacion: createDate(5, 12, 0),
        administrador_id: 2,
      },
      {
        // Cita pendiente para el futuro (en 10 días)
        cita_id: 7,
        paciente_id: 2,
        tipo_atencion_id: 5,
        fecha_hora_cita: createDate(10, 16, 0),
        estado_cita: "Pendiente",
        notas: "Control de diabetes.",
        fecha_creacion: createDate(8, 14, 0),
        administrador_id: 1,
      },
      {
        // Cita cancelada en el futuro (en 1 día)
        cita_id: 8,
        paciente_id: 3,
        tipo_atencion_id: 1,
        fecha_hora_cita: createDate(1, 10, 0),
        estado_cita: "Cancelada",
        notas: "Cita cancelada por imprevisto del doctor.",
        fecha_creacion: createDate(-1, 10, 0),
        administrador_id: 1,
      },
    ];

    // Nuevo paso: Corregimos las fechas que caen en fin de semana.
    const correctedAppointments = rawAppointments.map(appointment => {
      if (isSaturday(appointment.fecha_hora_cita) || isSunday(appointment.fecha_hora_cita)) {
        appointment.fecha_hora_cita = getNextWorkingDay(appointment.fecha_hora_cita);
      }
      return appointment;
    });

    await queryInterface.bulkInsert(
      "Citas",
      correctedAppointments,
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

    // 8. Historia_Clinica
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
          fecha_registro: createDate(-5, 10, 35),
          motivo_consulta: "Dolor de cabeza persistente.",
          antecedentes_personales: "Migrañas ocasionales en la adolescencia.",
          medicamentos_actuales: "Ninguno.",
          alergias: "Polen.",
          habitos_tabaco: false,
          habitos_alcohol: true,
          habitos_alimentacion: "Balanceada.",
        },
        {
          historia_clinica_id: 2,
          cita_id: 2,
          fecha_registro: createDate(-3, 15, 0),
          motivo_consulta: "Cancelada por el paciente.",
          antecedentes_personales: "Paciente diabético.",
          medicamentos_actuales: "Metformina 500mg.",
          alergias: "Ninguna conocida.",
          aqx: "Apendicectomía (2010).",
          amp: "Hipertensión controlada.",
          habitos_tabaco: false,
          habitos_alcohol: false,
          habitos_alimentacion: "Dieta controlada.",
        },
        {
          historia_clinica_id: 3,
          cita_id: 3,
          fecha_registro: createDate(-1, 9, 10),
          motivo_consulta: "Control de hipertensión.",
          antecedentes_personales: "Diagnóstico reciente.",
          medicamentos_actuales: "Losartán 50mg.",
          alergias: "Ninguna.",
          habitos_tabaco: true,
          habitos_alcohol: true,
          habitos_alimentacion: "Normal.",
        },
        {
          historia_clinica_id: 4,
          cita_id: 4,
          fecha_registro: today,
          motivo_consulta: "Sesión de seguimiento estética.",
          antecedentes_familiares: "Madre con osteoporosis.",
          medicamentos_actuales: "Anticonceptivos orales.",
          alergias: "Penicilina.",
          habitos_tabaco: false,
          habitos_alcohol: false,
          habitos_alimentacion: "Vegetariana.",
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
          fecha_registro: createDate(-5, 10, 45),
          region_explorada: "Cabeza y Cuello",
          hallazgos: "Sin hallazgos patológicos relevantes. Palpación de cuello normal.",
        },
        {
          historia_clinica_id: 3,
          cita_id: 3,
          fecha_registro: createDate(-1, 9, 30),
          region_explorada: "Cardiovascular y Pulmonar",
          hallazgos: "Ruidos cardíacos rítmicos, sin soplos. Campos pulmonares limpios, buena entrada de aire.",
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
          fecha_registro: createDate(-5, 11, 0),
          codigo_cie: "G43.9",
          nombre_diagnostico: "Migraña no especificada",
          descripcion: "Episodios recurrentes de cefalea.",
          es_principal: true,
          estado_diagnostico: "Activo",
        },
        {
          historia_clinica_id: 3,
          cita_id: 3,
          fecha_registro: createDate(-1, 9, 45),
          codigo_cie: "I10",
          nombre_diagnostico: "Hipertensión esencial (primaria)",
          descripcion: "Presión arterial elevada, en tratamiento.",
          es_principal: true,
          estado_diagnostico: "Crónico",
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
          fecha_registro: createDate(-5, 11, 15),
          descripcion_plan: "Manejo de migraña. Evitar desencadenantes conocidos.",
          medicamentos_recetados: "Ibuprofeno 400mg PRN.",
          indicaciones_adicionales: "Descanso en ambiente oscuro y tranquilo.",
          proxima_cita_recomendada: createDate(30, 9, 30).toISOString().split("T")[0],
          receta_adjunta_url: "https://ejemplo.com/receta-migrana-p1.pdf",
        },
        {
          historia_clinica_id: 3,
          cita_id: 3,
          fecha_registro: createDate(-1, 10, 0),
          descripcion_plan: "Control de hipertensión. Monitoreo domiciliario de PA.",
          medicamentos_recetados: "Losartán 50mg OD.",
          indicaciones_adicionales: "Reducir ingesta de sodio, caminata diaria.",
          proxima_cita_recomendada: createDate(15, 14, 0).toISOString().split("T")[0],
          receta_adjunta_url: "https://ejemplo.com/receta-hipertension-carlos.pdf",
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
          fecha_registro: createDate(-5, 10, 0),
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
          historia_clinica_id: 3,
          cita_id: 3,
          fecha_registro: createDate(-1, 9, 0),
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
          notas_adicionales: "Valores iniciales para tratamiento de hipertensión.",
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