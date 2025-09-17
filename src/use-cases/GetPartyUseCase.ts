// Use Case: Get Party
import { IPartyRepository } from '../repositories/interfaces';
import { IGetPartyUseCase } from './interfaces';

export class GetPartyUseCase implements IGetPartyUseCase {
  constructor(
    private partyRepository: IPartyRepository
  ) {}

  async execute(id: string): Promise<any> {
    try {
      if (!id) {
        throw new Error('Party ID is required');
      }

      const party = await this.partyRepository.findById(id);
      if (!party) {
        throw new Error('Party not found');
      }

      return party;
    } catch (error) {
      console.error('Error getting party:', error);
      throw error;
    }
  }
}