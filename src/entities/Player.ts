// Domain Entity: Player - Pure business logic, no external dependencies

import { IPlayer } from './interfaces';
import { Experience } from './valueObjects';

export class Player implements IPlayer {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly level: number,
    public readonly experience: Experience,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    if (level < 1) {
      throw new Error('Player level must be at least 1');
    }
    if (username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
  }

  public gainExperience(amount: number): Player {
    const newExperience = this.experience.add(amount);
    const newLevel = newExperience.isLevelUp() ? this.level + 1 : this.level;
    const nextLevelExp = this.calculateNextLevelExperience(newLevel);

    return new Player(
      this.id,
      this.username,
      newLevel,
      new Experience(0, nextLevelExp, newExperience.total),
      this.createdAt,
      new Date()
    );
  }

  public canUnlockContent(contentLevel: number): boolean {
    return this.level >= contentLevel;
  }

  public canCreateParty(maxCharacters: number): boolean {
    // Level 1: max 2 characters
    // Level 2-3: max 3 characters
    // Level 4+: max 4 characters
    const maxAllowed = this.level >= 4 ? 4 : this.level >= 2 ? 3 : 2;
    return maxCharacters <= maxAllowed;
  }

  public canAddRuleToCharacter(existingRulesCount: number): boolean {
    // Level 1: max 1 rule per character
    // Level 2-3: max 2 rules per character
    // Level 4+: max 3 rules per character
    const maxAllowed = this.level >= 4 ? 3 : this.level >= 2 ? 2 : 1;
    return existingRulesCount < maxAllowed;
  }

  private calculateNextLevelExperience(level: number): number {
    // Experience required = level * 100 + (level - 1) * 50
    // Level 1: 100, Level 2: 250, Level 3: 400, Level 4: 550, etc.
    return level * 100 + (level - 1) * 50;
  }

  public toJSON() {
    return {
      id: this.id,
      username: this.username,
      level: this.level,
      experience: this.experience.toJSON(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  public static fromJSON(data: any): Player {
    return new Player(
      data.id,
      data.username,
      data.level,
      new Experience(
        data.experience.current,
        data.experience.nextLevel,
        data.experience.total
      ),
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
}