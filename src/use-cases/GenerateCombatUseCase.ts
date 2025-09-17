import { IParty } from '../entities/interfaces';
import { IDungeon } from '../entities/interfaces';
import { ICombatResult } from '../entities/interfaces';
import { ICharacter } from '../entities/interfaces';
import { BattleSystem } from '../systems/BattleSystem';
import { BattleLogger } from '../utils/BattleLogger';
import { EntityFactory } from '../loaders/EntityFactory';
import { BattleSystemAdapter } from '../loaders/BattleSystemAdapter';
import { IPartyRepository } from '../repositories/interfaces';
import { IDungeonRepository } from '../repositories/interfaces';
import { ICombatResultRepository } from '../repositories/interfaces';
import { AwardExperienceUseCase, AwardExperienceResponse } from './AwardExperienceUseCase';
import { IPlayerRepository } from '../repositories/interfaces';

export interface GenerateCombatRequest {
  partyId: string;
  dungeonId: string;
  battleIndex?: number; // Optional: specific battle in dungeon, defaults to first
}

export interface GenerateCombatResponse {
  success: boolean;
  combatResult: ICombatResult;
  experienceResult?: AwardExperienceResponse;
  message: string;
}

export class GenerateCombatUseCase {
  constructor(
    private partyRepository: IPartyRepository,
    private dungeonRepository: IDungeonRepository,
    private combatResultRepository: ICombatResultRepository,
    private playerRepository: IPlayerRepository,
    private battleSystem: BattleSystem,
    private entityFactory: EntityFactory,
    private battleAdapter: BattleSystemAdapter,
    private logger?: BattleLogger
  ) {}

  async execute(request: GenerateCombatRequest): Promise<GenerateCombatResponse> {
    try {
      // 1. Validate and fetch party
      const party = await this.partyRepository.findById(request.partyId);
      if (!party) {
        return {
          success: false,
          combatResult: {} as ICombatResult,
          message: `Party with ID ${request.partyId} not found`
        };
      }

      // 2. Validate and fetch dungeon
      const dungeon = await this.dungeonRepository.findById(request.dungeonId);
      if (!dungeon) {
        return {
          success: false,
          combatResult: {} as ICombatResult,
          message: `Dungeon with ID ${request.dungeonId} not found`
        };
      }

      // 3. Determine which battle to run
      const battleIndex = request.battleIndex ?? 0;
      if (battleIndex >= dungeon.battles.length) {
        return {
          success: false,
          combatResult: {} as ICombatResult,
          message: `Battle index ${battleIndex} is out of range for dungeon ${dungeon.name}`
        };
      }

      const battle = dungeon.battles[battleIndex];

      // 4. Convert domain entities to BattleSystem format
      const allies = this.battleAdapter.convertPartyToCharacters(party);
      const enemies = this.battleAdapter.convertDungeonBattleToEnemies(dungeon, battleIndex);

      // 5. Get battle configuration
      const battleConfig = this.battleAdapter.getBattleConfig(dungeon, battleIndex);

      // 5. Initialize battle system
      const battleState = this.battleSystem.initializeBattle(allies, enemies);

      // 6. Execute the battle
      const battleResult = this.battleSystem.simulateFullBattle(battleConfig.maxTurns);

      // 7. Convert battle result to domain entities
      const combatResult = this.convertBattleResultToCombatResult(
        party,
        dungeon,
        battle,
        battleResult,
        battleState.history
      );

      // 8. Save combat result
      await this.combatResultRepository.save(combatResult);

      // 9. Award experience to player
      const awardExperienceUseCase = new AwardExperienceUseCase(this.playerRepository);
      const experienceResult = await awardExperienceUseCase.execute({
        playerId: party.playerId,
        combatResult: {
          victory: battleResult.victory,
          dungeonDifficulty: dungeon.difficulty,
          battleDuration: battleResult.turns,
          partySize: party.characters.length
        }
      });

      // 10. Log the combat if logger is available
      if (this.logger) {
        this.logger.logDebug('COMBAT', `Combat completed: ${combatResult.victories}/${combatResult.totalBattles} victories`);
        if (experienceResult.success) {
          this.logger.logDebug('EXPERIENCE', experienceResult.message);
        }
      }

      return {
        success: true,
        combatResult,
        experienceResult,
        message: `Combat completed with ${battleResult.victory ? 'victory' : 'defeat'}. ${experienceResult.message}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (this.logger) {
        this.logger.logError('COMBAT', `GenerateCombatUseCase failed: ${errorMessage}`);
      }

      return {
        success: false,
        combatResult: {} as ICombatResult,
        message: `Failed to generate combat: ${errorMessage}`
      };
    }
  }

  private convertBattleResultToCombatResult(
    party: IParty,
    dungeon: IDungeon,
    battle: any,
    battleResult: any,
    battleHistory: any[]
  ): ICombatResult {
    const battleResultEntity = {
      id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      battleId: battle.id,
      partyId: party.id,
      dungeonId: dungeon.id,
      victory: battleResult.victory,
      duration: battleResult.turns,
      rewards: {
        gold: battleResult.loot?.totalGold || 0,
        experience: battleResult.loot?.totalExperience || 0,
        items: battleResult.loot?.items.map((item: any) => ({
          id: item.item.id,
          name: item.item.name,
          type: item.item.type,
          rarity: item.item.rarity,
          value: item.item.value
        })) || []
      },
      log: battleHistory.map(turn => turn.message),
      createdAt: new Date()
    };

    return {
      id: `combat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      partyId: party.id,
      dungeonId: dungeon.id,
      totalBattles: 1,
      victories: battleResult.victory ? 1 : 0,
      totalDuration: battleResult.turns,
      totalRewards: battleResultEntity.rewards,
      battleResults: [battleResultEntity],
      createdAt: new Date()
    };
  }
}