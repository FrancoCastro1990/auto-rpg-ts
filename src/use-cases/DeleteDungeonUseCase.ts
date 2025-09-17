// Use Case: Delete Dungeon
import { IDungeonRepository } from '../repositories/interfaces';
import { IDeleteDungeonUseCase } from './interfaces';

export class DeleteDungeonUseCase implements IDeleteDungeonUseCase {
  constructor(
    private dungeonRepository: IDungeonRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error('Dungeon ID is required');
      }

      // Verify dungeon exists
      const dungeon = await this.dungeonRepository.findById(id);
      if (!dungeon) {
        throw new Error('Dungeon not found');
      }

      // TODO: Add business rules for dungeon deletion
      // For example: cannot delete dungeons that are currently being played
      // For now, allow deletion of any dungeon

      // Delete the dungeon
      const deleted = await this.dungeonRepository.delete(id);
      if (!deleted) {
        throw new Error('Failed to delete dungeon');
      }

      return true;

    } catch (error) {
      console.error('Error deleting dungeon:', error);
      throw error;
    }
  }
}