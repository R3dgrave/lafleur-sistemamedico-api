"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Nota: Los IDs primarios (como 'id', 'paciente_id') se generarán automáticamente
    // a menos que los especifiques en el insert y la columna no sea autoIncrement.
    // Es mejor dejarlos fuera si son autoIncrement para que la DB los asigne.

    // Datos para Administrador
    await queryInterface.bulkInsert(
      "Administradores",
      [
        {
          administrador_id: 1, // Especificar si quieres un ID fijo para pruebas, o quitarlo si la PK es autoIncrement
          nombre: "Admin",
          apellido: "Principal",
          email: "r3dgrave98@gmail.com",
          password_hash: "123456", // Hashear en aplicacion real, aquí es solo un ejemplo
        },
      ],
      { ignoreDuplicates: true }
    ); // ignoreDuplicates evita errores si ya existe el ID o email único

    // Datos para Pacientes
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
          telefono: "123456789",
          email: "paciente1@example.com",
          direccion: "Calle Falsa 123",
          rut: "11.111.111-1",
          fecha_registro: new Date(),
        },
        {
          paciente_id: 2,
          nombre: "Paciente Dos",
          apellido: "Apellido Dos",
          fecha_nacimiento: "1985-05-20",
          genero: "Femenino",
          identidad_genero: "Mujer",
          sexo_registral: "Femenino",
          telefono: "987654321",
          email: "paciente2@example.com",
          direccion: "Avenida Siempre Viva 742",
          rut: "22.222.222-2",
          fecha_registro: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );

    // Datos para Tipo_Atencion
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
      ],
      { ignoreDuplicates: true }
    );

    // Datos para Horarios_Disponibles
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
    ];
    await queryInterface.bulkInsert("Horarios_Disponibles", horarios, {
      ignoreDuplicates: true,
    });

    // Datos para Excepciones_Disponibilidad
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
        fecha: "2025-07-23",
        hora_inicio_bloqueo: "13:00:00",
        hora_fin_bloqueo: "14:00:00",
        es_dia_completo: false,
        descripcion: "Almuerzo",
      },
    ];
    await queryInterface.bulkInsert("Excepciones_Disponibilidad", excepciones, {
      ignoreDuplicates: true,
    });

    // Datos para Citas (FECHAS IMPORTANTES: 2025-07-22 10:00, 2025-07-23 11:00)
    await queryInterface.bulkInsert(
      "Citas",
      [
        {
          paciente_id: 1,
          tipo_atencion_id: 1,
          fecha_hora_cita: "2025-07-22T10:00:00-04:00", // Usa formato ISO 8601 con TZ
          estado_cita: "Confirmada",
          notas: "Cita para prueba de conflicto",
          fecha_creacion: new Date(),
          administrador_id: 1,
        },
        {
          paciente_id: 1,
          tipo_atencion_id: 2,
          fecha_hora_cita: "2025-07-23T11:00:00-04:00",
          estado_cita: "Pendiente",
          notas: "Cita regular",
          fecha_creacion: new Date(),
          administrador_id: 1,
        },
        {
          paciente_id: 2,
          tipo_atencion_id: 1,
          fecha_hora_cita: "2025-07-23T14:00:00-04:00",
          estado_cita: "Confirmada",
          notas: "Post-almuerzo",
          fecha_creacion: new Date(),
          administrador_id: 1,
        },
      ],
      { ignoreDuplicates: true }
    );

    // Datos para Contactos_Emergencia
    await queryInterface.bulkInsert(
      "Contactos_Emergencia",
      [
        {
          paciente_id: 1,
          nombre_contacto: "Familiar Paciente Uno",
          telefono_contacto: "111-222-3333",
          relacion_paciente: "Hermano",
          fecha_registro: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, Sequelize) {
    // El orden de eliminación en `down` debe ser el inverso al de inserción,
    // Se deben eliminar primero las tablas que tienen FKs hacia otras.
    // Es importante resetear las secuencias de IDs si las usas,
    // `bulkDelete` no hace eso por defecto.
    await queryInterface.bulkDelete("Citas", null, {});
    await queryInterface.bulkDelete("Contactos_Emergencia", null, {});
    await queryInterface.bulkDelete("Excepciones_Disponibilidad", null, {});
    await queryInterface.bulkDelete("Horarios_Disponibles", null, {});
    await queryInterface.bulkDelete("Tipo_Atencion", null, {});
    await queryInterface.bulkDelete("Pacientes", null, {});
    await queryInterface.bulkDelete("Administradores", null, {});
  },
};
