// Domain Entity: Dungeon - Pure business logic, no external dependencies

import { IDungeon, IBattle } from './interfaces';
import { Reward, Item } from './valueObjects';

export class Dungeon implements IDungeon {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly difficulty: number,
    public readonly minLevel: number,
    public readonly battles: IBattle[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    if (name.trim().length === 0) {
      throw new Error('Dungeon name cannot be empty');
    }
    if (description.trim().length === 0) {
      throw new Error('Dungeon description cannot be empty');
    }
    if (difficulty < 1 || difficulty > 10) {
      throw new Error('Dungeon difficulty must be between 1 and 10');
    }
    if (minLevel < 1) {
      throw new Error('Minimum level must be at least 1');
    }
    if (battles.length === 0) {
      throw new Error('Dungeon must have at least one battle');
    }
  }

  public getBattleByOrder(order: number): IBattle | undefined {
    return this.battles.find(battle => battle.order === order);
  }

  public calculateDifficulty(): number {
    // Calculate difficulty based on battles and their enemies
    const totalEnemyLevels = this.battles.reduce((sum, battle) => {
      return sum + battle.enemies.reduce((enemySum, enemy) => enemySum + enemy.level, 0);
    }, 0);

    const averageEnemyLevel = totalEnemyLevels / this.battles.length;
    const battleCount = this.battles.length;

    // Difficulty formula: base difficulty + enemy level factor + battle count factor
    return Math.min(10, Math.max(1,
      this.difficulty +
      Math.floor(averageEnemyLevel / 5) +
      Math.floor(battleCount / 2)
    ));
  }

  public getTotalReward(): Reward {
    const totalGold = this.battles.reduce((sum, battle) => sum + battle.rewards.gold, 0);
    const totalExperience = this.battles.reduce((sum, battle) => sum + battle.rewards.experience, 0);
    const allItems = this.battles.flatMap(battle =>
      battle.rewards.items.map(item => new Item(item.id, item.name, item.type, item.rarity, item.value))
    );

    return new Reward(totalGold, totalExperience, allItems);
  }

  public isAccessibleByParty(partyAverageLevel: number): boolean {
    return partyAverageLevel >= this.minLevel;
  }

  public estimateCombatDuration(): number {
    // Rough estimation: 30 seconds per battle + 10 seconds per enemy
    const totalEnemies = this.battles.reduce((sum, battle) => sum + battle.enemies.length, 0);
    return this.battles.length * 30 + totalEnemies * 10;
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      minLevel: this.minLevel,
      battles: this.battles,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  public static fromJSON(data: any): Dungeon {
    return new Dungeon(
      data.id,
      data.name,
      data.description,
      data.difficulty,
      data.minLevel,
      data.battles,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
}