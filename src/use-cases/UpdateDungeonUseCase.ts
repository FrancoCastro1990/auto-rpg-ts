// Use Case: Update Dungeon
import { IDungeonRepository } from '../repositories/interfaces';
import { IUpdateDungeonUseCase } from './interfaces';

export class UpdateDungeonUseCase implements IUpdateDungeonUseCase {
  constructor(
    private dungeonRepository: IDungeonRepository
  ) {}

  async execute(id: string, data: Partial<any>): Promise<any> {
    try {
      if (!id) {
        throw new Error('Dungeon ID is required');
      }

      // Verify dungeon exists
      const existingDungeon = await this.dungeonRepository.findById(id);
      if (!existingDungeon) {
        throw new Error('Dungeon not found');
      }

      // Validate difficulty if provided
      if (data.difficulty !== undefined && (data.difficulty < 1 || data.difficulty > 10)) {
        throw new Error('Difficulty must be between 1 and 10');
      }

      // Validate minLevel if provided
      if (data.minLevel !== undefined && data.minLevel < 1) {
        throw new Error('Minimum level must be at least 1');
      }

      // Validate battles structure if provided
      if (data.battles) {
        for (let i = 0; i < data.battles.length; i++) {
          const battle = data.battles[i];
          if (!battle.enemies || battle.enemies.length === 0) {
            throw new Error(`Battle ${i} must have at least one enemy`);
          }
          if (battle.order !== i) {
            throw new Error(`Battle ${i} must have order ${i}`);
          }
        }
      }

      // Update dungeon
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const updatedDungeon = await this.dungeonRepository.update(id, updateData);
      if (!updatedDungeon) {
        throw new Error('Failed to update dungeon');
      }

      return updatedDungeon;

    } catch (error) {
      console.error('Error updating dungeon:', error);
      throw error;
    }
  }
}