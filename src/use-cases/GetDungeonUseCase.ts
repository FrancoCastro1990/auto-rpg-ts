// Use Case: Get Dungeon
import { IDungeonRepository } from '../repositories/interfaces';
import { IGetDungeonUseCase } from './interfaces';

export class GetDungeonUseCase implements IGetDungeonUseCase {
  constructor(
    private dungeonRepository: IDungeonRepository
  ) {}

  async execute(id: string): Promise<any> {
    try {
      if (!id) {
        throw new Error('Dungeon ID is required');
      }

      const dungeon = await this.dungeonRepository.findById(id);
      if (!dungeon) {
        throw new Error('Dungeon not found');
      }

      return dungeon;
    } catch (error) {
      console.error('Error getting dungeon:', error);
      throw error;
    }
  }
}