// Domain Entity: CombatResult - Pure business logic, no external dependencies

import { ICombatResult, IBattleResult } from './interfaces';
import { Reward, Item } from './valueObjects';

export class CombatResult implements ICombatResult {
  constructor(
    public readonly id: string,
    public readonly partyId: string,
    public readonly dungeonId: string,
    public readonly totalBattles: number,
    public readonly victories: number,
    public readonly totalDuration: number,
    public readonly totalRewards: Reward,
    public readonly battleResults: IBattleResult[],
    public readonly createdAt: Date
  ) {
    if (totalBattles < 1) {
      throw new Error('Combat must have at least one battle');
    }
    if (victories < 0 || victories > totalBattles) {
      throw new Error('Victories must be between 0 and total battles');
    }
    if (totalDuration < 0) {
      throw new Error('Duration cannot be negative');
    }
    if (battleResults.length !== totalBattles) {
      throw new Error('Battle results count must match total battles');
    }
  }

  public getVictoryRate(): number {
    return this.victories / this.totalBattles;
  }

  public isCompleteVictory(): boolean {
    return this.victories === this.totalBattles;
  }

  public getAverageBattleDuration(): number {
    return Math.floor(this.totalDuration / this.totalBattles);
  }

  public getTotalExperienceGained(): number {
    return this.totalRewards.experience;
  }

  public getTotalGoldGained(): number {
    return this.totalRewards.gold;
  }

  public getItemsGained(): Item[] {
    return this.totalRewards.items;
  }

  public toJSON() {
    return {
      id: this.id,
      partyId: this.partyId,
      dungeonId: this.dungeonId,
      totalBattles: this.totalBattles,
      victories: this.victories,
      totalDuration: this.totalDuration,
      totalRewards: this.totalRewards.toJSON(),
      battleResults: this.battleResults,
      createdAt: this.createdAt.toISOString()
    };
  }

  public static fromJSON(data: any): CombatResult {
    return new CombatResult(
      data.id,
      data.partyId,
      data.dungeonId,
      data.totalBattles,
      data.victories,
      data.totalDuration,
      new Reward(
        data.totalRewards.gold,
        data.totalRewards.experience,
        data.totalRewards.items.map((itemData: any) =>
          new Item(itemData.id, itemData.name, itemData.type, itemData.rarity, itemData.value)
        )
      ),
      data.battleResults,
      new Date(data.createdAt)
    );
  }
}