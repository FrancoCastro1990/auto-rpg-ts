// Use Case: Get Dungeons
import { IDungeonRepository } from '../repositories/interfaces';
import { IGetDungeonsUseCase } from './interfaces';

export class GetDungeonsUseCase implements IGetDungeonsUseCase {
  constructor(
    private dungeonRepository: IDungeonRepository
  ) {}

  async execute(filters?: { difficulty?: number; minLevel?: number }): Promise<any[]> {
    try {
      if (filters?.difficulty) {
        return await this.dungeonRepository.findByDifficulty(filters.difficulty);
      }

      if (filters?.minLevel) {
        return await this.dungeonRepository.findAvailableForPlayer(filters.minLevel);
      }

      return await this.dungeonRepository.findAll();
    } catch (error) {
      console.error('Error getting dungeons:', error);
      throw error;
    }
  }
}