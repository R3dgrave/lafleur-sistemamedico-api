'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Administradores', {
      administrador_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellido: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      resetPasswordToken: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      resetPasswordExpires: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.createTable('Pacientes', {
      paciente_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellido: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      fecha_nacimiento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      genero: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      identidad_genero: {
        type: Sequelize.STRING(50)
      },
      sexo_registral: {
        type: Sequelize.STRING(20)
      },
      telefono: {
        type: Sequelize.STRING(20)
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      direccion: {
        type: Sequelize.STRING(255)
      },
      rut: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('Tipo_Atencion', {
      tipo_atencion_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nombre_atencion: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      duracion_minutos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      buffer_minutos: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      }
    });

    await queryInterface.createTable('Horarios_Disponibles', {
      horario_disponible_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      administrador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Administradores',
          key: 'administrador_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dia_semana: { // 0=Domingo, 1=Lunes, ..., 6=Sábado
        type: Sequelize.INTEGER,
        allowNull: false
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false
      },
      hora_fin: {
        type: Sequelize.TIME,
        allowNull: false
      }
    }).then(() => {
      return queryInterface.addIndex('Horarios_Disponibles', ['administrador_id', 'dia_semana', 'hora_inicio', 'hora_fin'], { unique: true, name: 'unique_horario_administrador_dia_hora' });
    });

    await queryInterface.createTable('Excepciones_Disponibilidad', {
      excepcion_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      administrador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Administradores',
          key: 'administrador_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      hora_inicio_bloqueo: {
        type: Sequelize.TIME
      },
      hora_fin_bloqueo: {
        type: Sequelize.TIME
      },
      es_dia_completo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      descripcion: {
        type: Sequelize.STRING(255)
      }
    });

    await queryInterface.createTable('Contactos_Emergencia', {
      contacto_emergencia_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      paciente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pacientes',
          key: 'paciente_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nombre_contacto: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      telefono_contacto: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      relacion_paciente: {
        type: Sequelize.STRING(50)
      },
      fecha_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('Citas', {
      cita_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      paciente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pacientes',
          key: 'paciente_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo_atencion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tipo_Atencion',
          key: 'tipo_atencion_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fecha_hora_cita: {
        type: Sequelize.DATE,
        allowNull: false
      },
      estado_cita: {
        type: Sequelize.STRING(50),
        defaultValue: "Pendiente",
        allowNull: false
      },
      notas: {
        type: Sequelize.TEXT
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      administrador_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Administradores',
          key: 'administrador_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Citas');
    await queryInterface.dropTable('Contactos_Emergencia');
    await queryInterface.dropTable('Excepciones_Disponibilidad');
    await queryInterface.dropTable('Horarios_Disponibles');
    await queryInterface.dropTable('Tipo_Atencion');
    await queryInterface.dropTable('Pacientes');
    await queryInterface.dropTable('Administradores');
  }
};