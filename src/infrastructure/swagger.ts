import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auto RPG API',
      version: '1.0.0',
      description: 'API REST para el sistema de combate automático RPG con gestión de parties y dungeons',
      contact: {
        name: 'Auto RPG Team',
        email: 'contact@auto-rpg.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.auto-rpg.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Player: {
          type: 'object',
          required: ['username', 'level', 'experience'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único del jugador'
            },
            username: {
              type: 'string',
              description: 'Nombre de usuario único'
            },
            level: {
              type: 'number',
              description: 'Nivel actual del jugador',
              minimum: 1
            },
            experience: {
              type: 'number',
              description: 'Experiencia total acumulada',
              minimum: 0
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        Character: {
          type: 'object',
          required: ['name', 'job', 'level'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único del personaje'
            },
            name: {
              type: 'string',
              description: 'Nombre del personaje'
            },
            job: {
              type: 'string',
              description: 'Clase/profesión del personaje',
              enum: ['warrior', 'mage', 'cleric', 'rogue']
            },
            level: {
              type: 'number',
              description: 'Nivel del personaje',
              minimum: 1
            },
            rules: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Rule'
              },
              description: 'Reglas de comportamiento del personaje'
            }
          }
        },
        Rule: {
          type: 'object',
          required: ['priority', 'condition', 'target', 'action'],
          properties: {
            priority: {
              type: 'number',
              description: 'Prioridad de la regla (mayor número = mayor prioridad)',
              minimum: 1
            },
            condition: {
              type: 'string',
              description: 'Condición que debe cumplirse para activar la regla'
            },
            target: {
              type: 'string',
              description: 'Objetivo de la acción'
            },
            action: {
              type: 'string',
              description: 'Acción a realizar'
            }
          }
        },
        Party: {
          type: 'object',
          required: ['playerId', 'characters'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la party'
            },
            playerId: {
              type: 'string',
              description: 'ID del jugador propietario'
            },
            name: {
              type: 'string',
              description: 'Nombre de la party'
            },
            characters: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Character'
              },
              description: 'Personajes en la party',
              maxItems: 4
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        Dungeon: {
          type: 'object',
          required: ['name', 'difficulty', 'battles'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la dungeon'
            },
            name: {
              type: 'string',
              description: 'Nombre de la dungeon'
            },
            description: {
              type: 'string',
              description: 'Descripción de la dungeon'
            },
            difficulty: {
              type: 'string',
              description: 'Nivel de dificultad',
              enum: ['easy', 'medium', 'hard', 'expert']
            },
            battles: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Battle'
              },
              description: 'Batallas que componen la dungeon'
            },
            experienceReward: {
              type: 'number',
              description: 'Experiencia otorgada al completar la dungeon',
              minimum: 0
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          }
        },
        Battle: {
          type: 'object',
          required: ['order', 'enemies'],
          properties: {
            order: {
              type: 'number',
              description: 'Orden de la batalla en la dungeon',
              minimum: 1
            },
            enemies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    description: 'Tipo de enemigo'
                  },
                  name: {
                    type: 'string',
                    description: 'Nombre del enemigo'
                  },
                  level: {
                    type: 'number',
                    description: 'Nivel del enemigo',
                    minimum: 1
                  }
                }
              },
              description: 'Enemigos en esta batalla'
            }
          }
        },
        CombatResult: {
          type: 'object',
          required: ['dungeonId', 'partyId', 'result', 'experienceGained'],
          properties: {
            dungeonId: {
              type: 'string',
              description: 'ID de la dungeon jugada'
            },
            partyId: {
              type: 'string',
              description: 'ID de la party utilizada'
            },
            result: {
              type: 'string',
              description: 'Resultado del combate',
              enum: ['victory', 'defeat']
            },
            experienceGained: {
              type: 'number',
              description: 'Experiencia ganada',
              minimum: 0
            },
            combatLog: {
              type: 'array',
              items: {
                type: 'object',
                description: 'Registro detallado del combate para animaciones'
              },
              description: 'Log completo del combate'
            },
            playerLevelUp: {
              type: 'boolean',
              description: 'Si el jugador subió de nivel'
            },
            newPlayerLevel: {
              type: 'number',
              description: 'Nuevo nivel del jugador (si subió)'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Mensaje de error'
            },
            code: {
              type: 'string',
              description: 'Código de error para identificación'
            },
            details: {
              type: 'object',
              description: 'Detalles adicionales del error'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Mensaje de error de validación'
            },
            code: {
              type: 'string',
              example: 'VALIDATION_ERROR'
            },
            fields: {
              type: 'object',
              description: 'Campos específicos con errores de validación'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };