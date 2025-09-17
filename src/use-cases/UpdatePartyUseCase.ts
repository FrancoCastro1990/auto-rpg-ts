// Use Case: Update Party
import { IPartyRepository } from '../repositories/interfaces';
import { IPlayerRepository } from '../repositories/interfaces';
import { IUpdatePartyUseCase } from './interfaces';
import { Party } from '../entities/Party';
import { Character } from '../entities/Character';
import { Player } from '../entities/Player';
import { Stats, Rule, Experience } from '../entities/valueObjects';

export class UpdatePartyUseCase implements IUpdatePartyUseCase {
  constructor(
    private partyRepository: IPartyRepository,
    private playerRepository: IPlayerRepository
  ) {}

  async execute(id: string, data: Partial<any>): Promise<any> {
    try {
      if (!id) {
        throw new Error('Party ID is required');
      }

      // Verify party exists
      const existingParty = await this.partyRepository.findById(id);
      if (!existingParty) {
        throw new Error('Party not found');
      }

      // If updating characters, verify player permissions
      if (data.characters) {
        const playerData = await this.playerRepository.findById(existingParty.playerId);
        if (!playerData) {
          throw new Error('Player not found');
        }

        // Create Player instance to use domain methods
        const player = new Player(
          playerData.id,
          playerData.username,
          playerData.level,
          new Experience(
            playerData.experience.current,
            playerData.experience.nextLevel,
            playerData.experience.total
          ),
          playerData.createdAt,
          playerData.updatedAt
        );

        // Validate character limit
        if (!player.canCreateParty(data.characters.length)) {
          throw new Error(`Player level ${player.level} can only have up to ${this.getMaxCharactersForLevel(player.level)} characters per party`);
        }

        // Convert character data to Character entities
        const characters: Character[] = data.characters.map((charData: any) => {
          const rules = charData.rules ? charData.rules.map((ruleData: any) =>
            new Rule(ruleData.id, ruleData.priority, ruleData.condition, ruleData.target, ruleData.action)
          ) : [];

          return new Character(
            charData.id,
            charData.name,
            charData.job,
            charData.level,
            new Stats(
              charData.stats.hp,
              charData.stats.mp,
              charData.stats.str,
              charData.stats.def,
              charData.stats.mag,
              charData.stats.spd
            ),
            charData.skills || [],
            rules
          );
        });

        // Create updated party
        const updatedParty = new Party(
          existingParty.id,
          existingParty.playerId,
          data.name || existingParty.name,
          characters,
          existingParty.createdAt,
          new Date()
        );

        // Save to database
        return await this.partyRepository.save(updatedParty);
      }

      // For other updates (name only)
      const updateData = {
        name: data.name,
        updatedAt: new Date()
      };

      const updatedParty = await this.partyRepository.update(id, updateData);
      if (!updatedParty) {
        throw new Error('Failed to update party');
      }

      return updatedParty;

    } catch (error) {
      console.error('Error updating party:', error);
      throw error;
    }
  }

  private getMaxCharactersForLevel(level: number): number {
    // Level 1: 2 characters, Level 2-3: 3 characters, Level 4+: 4 characters
    if (level === 1) return 2;
    if (level <= 3) return 3;
    return 4;
  }
}