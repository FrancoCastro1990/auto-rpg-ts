// Domain Entity: Party - Pure business logic, no external dependencies

import { IParty } from './interfaces';
import { Character } from './Character';

export class Party implements IParty {
  constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly name: string,
    public readonly characters: Character[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    if (name.trim().length === 0) {
      throw new Error('Party name cannot be empty');
    }
    if (characters.length === 0) {
      throw new Error('Party must have at least one character');
    }
  }

  public addCharacter(character: Character, playerLevel: number): Party {
    if (!this.canAddCharacter(playerLevel)) {
      throw new Error('Cannot add more characters to this party');
    }

    if (this.characters.some(c => c.id === character.id)) {
      throw new Error('Character is already in the party');
    }

    return new Party(
      this.id,
      this.playerId,
      this.name,
      [...this.characters, character],
      this.createdAt,
      new Date()
    );
  }

  public removeCharacter(characterId: string): Party {
    if (this.characters.length <= 1) {
      throw new Error('Party must have at least one character');
    }

    const filteredCharacters = this.characters.filter(c => c.id !== characterId);

    if (filteredCharacters.length === this.characters.length) {
      throw new Error('Character not found in party');
    }

    return new Party(
      this.id,
      this.playerId,
      this.name,
      filteredCharacters,
      this.createdAt,
      new Date()
    );
  }

  public validateRulesLimit(playerLevel: number): boolean {
    // Check if any character exceeds the rule limit for the player's level
    return this.characters.every(character =>
      character.rules.length <= this.getMaxRulesPerCharacter(playerLevel)
    );
  }

  public canAddCharacter(playerLevel: number): boolean {
    const maxCharacters = this.getMaxCharactersForLevel(playerLevel);
    return this.characters.length < maxCharacters;
  }

  public getTotalLevel(): number {
    return this.characters.reduce((sum, character) => sum + character.level, 0);
  }

  public getAverageLevel(): number {
    return Math.floor(this.getTotalLevel() / this.characters.length);
  }

  private getMaxCharactersForLevel(playerLevel: number): number {
    // Level 1: max 2 characters
    // Level 2-3: max 3 characters
    // Level 4+: max 4 characters
    return playerLevel >= 4 ? 4 : playerLevel >= 2 ? 3 : 2;
  }

  private getMaxRulesPerCharacter(playerLevel: number): number {
    // Level 1: max 1 rule per character
    // Level 2-3: max 2 rules per character
    // Level 4+: max 3 rules per character
    return playerLevel >= 4 ? 3 : playerLevel >= 2 ? 2 : 1;
  }

  public toJSON() {
    return {
      id: this.id,
      playerId: this.playerId,
      name: this.name,
      characters: this.characters.map(character => character.toJSON()),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  public static fromJSON(data: any): Party {
    return new Party(
      data.id,
      data.playerId,
      data.name,
      data.characters.map((charData: any) => Character.fromJSON(charData)),
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
}