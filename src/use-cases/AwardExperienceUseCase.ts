import { IPlayer } from '../entities/interfaces';
import { IPlayerRepository } from '../repositories/interfaces';
import { ExperienceService, ExperienceCalculationParams } from '../entities/ExperienceService';

export interface AwardExperienceRequest {
  playerId: string;
  combatResult: {
    victory: boolean;
    dungeonDifficulty: number;
    battleDuration: number;
    partySize: number;
  };
}

export interface AwardExperienceResponse {
  success: boolean;
  player: IPlayer;
  experienceGained: number;
  leveledUp: boolean;
  previousLevel: number;
  message: string;
}

export class AwardExperienceUseCase {
  constructor(
    private playerRepository: IPlayerRepository
  ) {}

  async execute(request: AwardExperienceRequest): Promise<AwardExperienceResponse> {
    try {
      // Fetch the player
      const player = await this.playerRepository.findById(request.playerId);
      if (!player) {
        return {
          success: false,
          player: {} as IPlayer,
          experienceGained: 0,
          leveledUp: false,
          previousLevel: 0,
          message: `Player with ID ${request.playerId} not found`
        };
      }

      const previousLevel = player.level;

      // Calculate experience parameters
      const experienceParams: ExperienceCalculationParams = {
        victory: request.combatResult.victory,
        dungeonDifficulty: request.combatResult.dungeonDifficulty,
        battleDuration: request.combatResult.battleDuration,
        playerLevel: player.level,
        partySize: request.combatResult.partySize
      };

      // Calculate experience gained
      const experienceGained = ExperienceService.calculateCombatExperience(experienceParams);

      // Award experience to player
      const updatedPlayer = ExperienceService.awardExperience(player, experienceGained);

      // Save updated player
      const savedPlayer = await this.playerRepository.save(updatedPlayer);

      const leveledUp = savedPlayer.level > previousLevel;

      return {
        success: true,
        player: savedPlayer,
        experienceGained,
        leveledUp,
        previousLevel,
        message: leveledUp
          ? `Gained ${experienceGained} experience and leveled up to level ${savedPlayer.level}!`
          : `Gained ${experienceGained} experience`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        player: {} as IPlayer,
        experienceGained: 0,
        leveledUp: false,
        previousLevel: 0,
        message: `Failed to award experience: ${errorMessage}`
      };
    }
  }
}