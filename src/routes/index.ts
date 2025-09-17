// Routes: Main API routes configuration with versioning
import { Router } from 'express';
import { createPartyRoutes } from '../controllers/PartyRoutes';
import { createDungeonRoutes } from '../controllers/DungeonRoutes';
import { createGenerateCombatRoutes } from '../controllers/GenerateCombatRoutes';
import { IPartyRepository } from '../repositories/interfaces';
import { IDungeonRepository } from '../repositories/interfaces';
import { ICombatResultRepository } from '../repositories/interfaces';
import { IPlayerRepository } from '../repositories/interfaces';
import { IUserRepository } from '../repositories/interfaces';
import { BattleSystem } from '../systems/BattleSystem';
import { EntityFactory } from '../loaders/EntityFactory';
import { BattleSystemAdapter } from '../loaders/BattleSystemAdapter';
import { BattleLogger } from '../utils/BattleLogger';
import authRoutes from './auth';

export function createAPIRoutes(
  partyRepository: IPartyRepository,
  dungeonRepository: IDungeonRepository,
  combatResultRepository: ICombatResultRepository,
  playerRepository: IPlayerRepository,
  userRepository: IUserRepository,
  battleSystem: BattleSystem,
  entityFactory: EntityFactory,
  battleAdapter: BattleSystemAdapter,
  logger?: BattleLogger
): Router {
  const router = Router();

  // API v1 routes
  const v1Router = Router();

  // Authentication routes (public)
  v1Router.use('/auth', authRoutes);

  // Party routes
  v1Router.use('/parties', createPartyRoutes(partyRepository, playerRepository));

  // Dungeon routes
  v1Router.use('/dungeons', createDungeonRoutes(dungeonRepository));

  // Generate combat routes (this creates /dungeon/:dungeonId/generate)
  v1Router.use('/', createGenerateCombatRoutes(
    partyRepository,
    dungeonRepository,
    combatResultRepository,
    playerRepository,
    battleSystem,
    entityFactory,
    battleAdapter,
    logger
  ));

  // Mount v1 routes under /api/v1
  router.use('/v1', v1Router);

  // API root endpoint
  router.get('/v1', (req, res) => {
    res.json({
      message: 'Auto RPG API v1.0',
      status: 'Running',
      version: '1.0.0',
      endpoints: {
        parties: {
          list: 'GET /api/v1/parties?playerId={playerId}',
          create: 'POST /api/v1/parties',
          get: 'GET /api/v1/parties/{id}',
          update: 'PUT /api/v1/parties/{id}',
          delete: 'DELETE /api/v1/parties/{id}'
        },
        dungeons: {
          list: 'GET /api/v1/dungeons?difficulty={1-10}&minLevel={level}',
          create: 'POST /api/v1/dungeons',
          get: 'GET /api/v1/dungeons/{id}',
          update: 'PUT /api/v1/dungeons/{id}',
          delete: 'DELETE /api/v1/dungeons/{id}'
        },
        combat: {
          generate: 'POST /api/v1/dungeon/{dungeonId}/generate'
        },
        auth: {
          register: 'POST /api/v1/auth/register',
          login: 'POST /api/v1/auth/login',
          refresh: 'POST /api/v1/auth/refresh',
          logout: 'POST /api/v1/auth/logout',
          profile: 'GET /api/v1/auth/profile'
        }
      },
      documentation: '/api/docs'
    });
  });

  return router;
}