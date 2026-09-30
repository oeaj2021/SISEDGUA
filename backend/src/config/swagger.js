const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SISEDGUA API - Sistema de Sala Situacional CDCE Guárico',
      version: '1.0.0',
      description: `
API REST para el Sistema de Sala Situacional del Centro de Control de Estudios Educativo (CDCE) del Estado Guárico.

## Funcionalidades Principales

- **Autenticación JWT**: Sistema de login con tokens seguros
- **Gestión de Reportes**: Registro y consulta de asistencia escolar por turnos
- **Dashboard en Tiempo Real**: Métricas estadísticas con caché Redis
- **Consejos Comunales**: Registro independiente de comunidades
- **Control de Horarios**: Middleware que valida horarios de apertura
- **Carga Masiva**: Importación de reportes vía Excel

## Arquitectura

- **Base de Datos**: PostgreSQL 16
- **Caché**: Redis 7 con rate limiting distribuido
- **Autenticación**: JWT con expiración de 8 horas
- **Rate Limiting**: 100 req/15min por IP (general), 10 req/15min (reportes)
      `,
      contact: {
        name: 'CDCE Estadal Guárico',
        email: 'admin@sisedgua.ve'
      },
      license: {
        name: 'Propiedad del Estado Guárico',
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Servidor de Desarrollo'
      },
      {
        url: 'https://sisedgua.guarico.gob.ve/api',
        description: 'Servidor de Producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Mensaje descriptivo del error'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              example: true
            },
            mensaje: {
              type: 'string',
              example: 'Operación exitosa'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Autenticación y autorización'
      },
      {
        name: 'Reportes',
        description: 'Gestión de reportes de asistencia escolar'
      },
      {
        name: 'Dashboard',
        description: 'Métricas y estadísticas en tiempo real'
      },
      {
        name: 'Instituciones',
        description: 'Catálogo de instituciones educativas'
      },
      {
        name: 'Consejos Comunales',
        description: 'Gestión de registros comunales'
      },
      {
        name: 'Horarios',
        description: 'Configuración de horarios de operación'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
