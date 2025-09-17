// Use Case: Delete Party
import { IPartyRepository } from '../repositories/interfaces';
import { IPlayerRepository } from '../repositories/interfaces';
import { IDeletePartyUseCase } from './interfaces';

export class DeletePartyUseCase implements IDeletePartyUseCase {
  constructor(
    private partyRepository: IPartyRepository,
    private playerRepository: IPlayerRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error('Party ID is required');
      }

      // Verify party exists
      const party = await this.partyRepository.findById(id);
      if (!party) {
        throw new Error('Party not found');
      }

      // TODO: Add business rules for party deletion
      // For example: cannot delete parties that are currently in combat
      // For now, allow deletion of any party

      // Delete the party
      const deleted = await this.partyRepository.delete(id);
      if (!deleted) {
        throw new Error('Failed to delete party');
      }

      return true;

    } catch (error) {
      console.error('Error deleting party:', error);
      throw error;
    }
  }
}