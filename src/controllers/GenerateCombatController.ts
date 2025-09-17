// Controller: Generate Combat REST API endpoint
import { Request, Response } from 'express';
import { GenerateCombatUseCase, GenerateCombatRequest } from '../use-cases/GenerateCombatUseCase';
import { IPartyRepository } from '../repositories/interfaces';
import { IDungeonRepository } from '../repositories/interfaces';
import { ICombatResultRepository } from '../repositories/interfaces';
import { IPlayerRepository } from '../repositories/interfaces';
import { BattleSystem } from '../systems/BattleSystem';
import { EntityFactory } from '../loaders/EntityFactory';
import { BattleSystemAdapter } from '../loaders/BattleSystemAdapter';
import { BattleLogger } from '../utils/BattleLogger';

export class GenerateCombatController {
  constructor(
    private generateCombatUseCase: GenerateCombatUseCase
  ) {}

  /**
   * POST /api/dungeon/:dungeonId/generate
   * Generate combat for a specific dungeon and party
   */
  async generateCombat(req: Request, res: Response): Promise<void> {
    try {
      const { dungeonId } = req.params;
      const { partyId, battleIndex } = req.body;

      // Basic validation
      if (!dungeonId) {
        res.status(400).json({
          success: false,
          error: 'Dungeon ID is required in URL path'
        });
        return;
      }

      if (!partyId) {
        res.status(400).json({
          success: false,
          error: 'Party ID is required in request body'
        });
        return;
      }

      // Validate battleIndex if provided
      if (battleIndex !== undefined) {
        const indexNum = parseInt(battleIndex);
        if (isNaN(indexNum) || indexNum < 0) {
          res.status(400).json({
            success: false,
            error: 'Battle index must be a non-negative integer'
          });
          return;
        }
      }

      // Prepare request for use case
      const request: GenerateCombatRequest = {
        partyId,
        dungeonId
      };

      // Only add battleIndex if it's provided and valid
      if (battleIndex !== undefined && battleIndex !== null) {
        request.battleIndex = parseInt(battleIndex);
      }

      // Execute use case
      const result = await this.generateCombatUseCase.execute(request);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.message,
          combatResult: result.combatResult
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          combatResult: result.combatResult,
          experienceAwarded: result.experienceResult
        },
        message: result.message
      });

    } catch (error) {
      console.error('Error generating combat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: `Failed to generate combat: ${errorMessage}`
      });
    }
  }
}

// Factory function to create GenerateCombatController with dependencies
export function createGenerateCombatController(
  partyRepository: IPartyRepository,
  dungeonRepository: IDungeonRepository,
  combatResultRepository: ICombatResultRepository,
  playerRepository: IPlayerRepository,
  battleSystem: BattleSystem,
  entityFactory: EntityFactory,
  battleAdapter: BattleSystemAdapter,
  logger?: BattleLogger
): GenerateCombatController {
  const generateCombatUseCase = new GenerateCombatUseCase(
    partyRepository,
    dungeonRepository,
    combatResultRepository,
    playerRepository,
    battleSystem,
    entityFactory,
    battleAdapter,
    logger
  );

  return new GenerateCombatController(generateCombatUseCase);
}