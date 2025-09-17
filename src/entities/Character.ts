// Domain Entity: Character - Pure business logic, no external dependencies

import { ICharacter } from './interfaces';
import { Stats, Rule } from './valueObjects';

export class Character implements ICharacter {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly job: string,
    public readonly level: number,
    public readonly stats: Stats,
    public readonly skills: string[],
    public readonly rules: Rule[]
  ) {
    if (name.trim().length === 0) {
      throw new Error('Character name cannot be empty');
    }
    if (job.trim().length === 0) {
      throw new Error('Character job cannot be empty');
    }
    if (level < 1) {
      throw new Error('Character level must be at least 1');
    }
  }

  public calculateStats(): Stats {
    // Base stats from job and level
    const baseStats = this.getBaseStats();
    const levelBonus = this.calculateLevelBonus();

    return baseStats.add(levelBonus);
  }

  public hasAbility(abilityId: string): boolean {
    return this.skills.includes(abilityId);
  }

  public canAddRule(playerLevel: number): boolean {
    // Check player's level restrictions
    const maxRules = playerLevel >= 4 ? 3 : playerLevel >= 2 ? 2 : 1;
    return this.rules.length < maxRules;
  }

  public addRule(rule: Rule, playerLevel: number): Character {
    if (!this.canAddRule(playerLevel)) {
      throw new Error('Cannot add more rules to this character');
    }

    return new Character(
      this.id,
      this.name,
      this.job,
      this.level,
      this.stats,
      this.skills,
      [...this.rules, rule]
    );
  }

  public removeRule(ruleId: string): Character {
    const filteredRules = this.rules.filter(rule => rule.id !== ruleId);

    return new Character(
      this.id,
      this.name,
      this.job,
      this.level,
      this.stats,
      this.skills,
      filteredRules
    );
  }

  private getBaseStats(): Stats {
    // This would typically come from the job data
    // For now, return the stored stats
    return this.stats;
  }

  private calculateLevelBonus(): Stats {
    // Simple level scaling: +10% per level
    const multiplier = 1 + (this.level - 1) * 0.1;
    return this.stats.multiply(multiplier);
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      job: this.job,
      level: this.level,
      stats: this.stats.toJSON(),
      skills: this.skills,
      rules: this.rules.map(rule => rule.toJSON())
    };
  }

  public static fromJSON(data: any): Character {
    return new Character(
      data.id,
      data.name,
      data.job,
      data.level,
      new Stats(
        data.stats.hp,
        data.stats.mp,
        data.stats.str,
        data.stats.def,
        data.stats.mag,
        data.stats.spd
      ),
      data.skills,
      data.rules.map((ruleData: any) => new Rule(
        ruleData.id,
        ruleData.priority,
        ruleData.condition,
        ruleData.target,
        ruleData.action
      ))
    );
  }
}