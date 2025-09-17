// Use Case: Get Player Parties
import { IPartyRepository } from '../repositories/interfaces';
import { IGetPlayerPartiesUseCase } from './interfaces';

export class GetPlayerPartiesUseCase implements IGetPlayerPartiesUseCase {
  constructor(
    private partyRepository: IPartyRepository
  ) {}

  async execute(playerId: string): Promise<any[]> {
    try {
      if (!playerId) {
        throw new Error('Player ID is required');
      }

      const parties = await this.partyRepository.findByPlayerId(playerId);
      return parties;
    } catch (error) {
      console.error('Error getting player parties:', error);
      throw error;
    }
  }
}