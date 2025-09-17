// Routes: Generate Combat API endpoint
import { Router } from 'express';
import { GenerateCombatController, createGenerateCombatController } from '../controllers/GenerateCombatController';
import { validateGenerateCombat } from './validation';
import { IPartyRepository } from '../repositories/interfaces';
import { IDungeonRepository } from '../repositories/interfaces';
import { ICombatResultRepository } from '../repositories/interfaces';
import { IPlayerRepository } from '../repositories/interfaces';
import { BattleSystem } from '../systems/BattleSystem';
import { EntityFactory } from '../loaders/EntityFactory';
import { BattleSystemAdapter } from '../loaders/BattleSystemAdapter';
import { BattleLogger } from '../utils/BattleLogger';

export function createGenerateCombatRoutes(
  partyRepository: IPartyRepository,
  dungeonRepository: IDungeonRepository,
  combatResultRepository: ICombatResultRepository,
  playerRepository: IPlayerRepository,
  battleSystem: BattleSystem,
  entityFactory: EntityFactory,
  battleAdapter: BattleSystemAdapter,
  logger?: BattleLogger
): Router {
  const router = Router();
  const generateCombatController = createGenerateCombatController(
    partyRepository,
    dungeonRepository,
    combatResultRepository,
    playerRepository,
    battleSystem,
    entityFactory,
    battleAdapter,
    logger
  );

  /**
   * POST /api/dungeon/:dungeonId/generate
   * Generate combat for a specific dungeon and party
   * Body: { partyId: string, battleIndex?: number }
   */
  router.post('/dungeon/:dungeonId/generate', validateGenerateCombat, (req, res) =>
    generateCombatController.generateCombat(req, res)
  );

  return router;
}