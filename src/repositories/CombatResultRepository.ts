// Concrete implementation of CombatResultRepository using Mongoose
import { ICombatResultRepository } from './interfaces';
import { ICombatResult, IBattleResult } from '../entities/interfaces';
import { CombatResultModel, ICombatResultDocument } from '../infrastructure/models/CombatResult';
import { CombatResult } from '../entities/CombatResult';
import { Reward, Item } from '../entities/valueObjects';

export class CombatResultRepository implements ICombatResultRepository {
  async findById(id: string): Promise<ICombatResult | null> {
    try {
      const combatResultDoc = await CombatResultModel.findById(id);
      if (!combatResultDoc) return null;

      return this.documentToCombatResult(combatResultDoc);
    } catch (error) {
      console.error('Error finding combat result by ID:', error);
      return null;
    }
  }

  async findAll(): Promise<ICombatResult[]> {
    try {
      const combatResultDocs: ICombatResultDocument[] = await CombatResultModel.find().sort({ createdAt: -1 });
      return combatResultDocs.map((doc: ICombatResultDocument) => this.documentToCombatResult(doc));
    } catch (error) {
      console.error('Error finding all combat results:', error);
      return [];
    }
  }

  async save(combatResult: ICombatResult): Promise<ICombatResult> {
    try {
      const combatResultData = {
        partyId: combatResult.partyId,
        dungeonId: combatResult.dungeonId,
        totalBattles: combatResult.totalBattles,
        victories: combatResult.victories,
        totalDuration: combatResult.totalDuration,
        totalRewards: {
          gold: combatResult.totalRewards.gold,
          experience: combatResult.totalRewards.experience,
          items: combatResult.totalRewards.items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            value: item.value
          }))
        },
        battleResults: combatResult.battleResults.map(battleResult => ({
          id: battleResult.id,
          battleId: battleResult.battleId,
          partyId: battleResult.partyId,
          dungeonId: battleResult.dungeonId,
          victory: battleResult.victory,
          duration: battleResult.duration,
          rewards: {
            gold: battleResult.rewards.gold,
            experience: battleResult.rewards.experience,
            items: battleResult.rewards.items.map(item => ({
              id: item.id,
              name: item.name,
              type: item.type,
              rarity: item.rarity,
              value: item.value
            }))
          },
          log: battleResult.log,
          createdAt: battleResult.createdAt
        })),
        createdAt: combatResult.createdAt
      };

      const combatResultDoc = new CombatResultModel(combatResultData);
      const savedDoc = await combatResultDoc.save();

      return this.documentToCombatResult(savedDoc);
    } catch (error) {
      console.error('Error saving combat result:', error);
      throw new Error('Failed to save combat result');
    }
  }

  async update(id: string, updates: Partial<ICombatResult>): Promise<ICombatResult | null> {
    try {
      const updateData: any = {};

      if (updates.totalBattles !== undefined) updateData.totalBattles = updates.totalBattles;
      if (updates.victories !== undefined) updateData.victories = updates.victories;
      if (updates.totalDuration !== undefined) updateData.totalDuration = updates.totalDuration;
      if (updates.totalRewards) {
        updateData.totalRewards = {
          gold: updates.totalRewards.gold,
          experience: updates.totalRewards.experience,
          items: updates.totalRewards.items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            value: item.value
          }))
        };
      }
      if (updates.battleResults) {
        updateData.battleResults = updates.battleResults.map(battleResult => ({
          id: battleResult.id,
          battleId: battleResult.battleId,
          partyId: battleResult.partyId,
          dungeonId: battleResult.dungeonId,
          victory: battleResult.victory,
          duration: battleResult.duration,
          rewards: {
            gold: battleResult.rewards.gold,
            experience: battleResult.rewards.experience,
            items: battleResult.rewards.items.map(item => ({
              id: item.id,
              name: item.name,
              type: item.type,
              rarity: item.rarity,
              value: item.value
            }))
          },
          log: battleResult.log,
          createdAt: battleResult.createdAt
        }));
      }

      const updatedDoc = await CombatResultModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedDoc) return null;

      return this.documentToCombatResult(updatedDoc);
    } catch (error) {
      console.error('Error updating combat result:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await CombatResultModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Error deleting combat result:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await CombatResultModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      console.error('Error checking combat result existence:', error);
      return false;
    }
  }

  async findByPartyId(partyId: string): Promise<ICombatResult[]> {
    try {
      const combatResultDocs: ICombatResultDocument[] = await CombatResultModel.find({ partyId }).sort({ createdAt: -1 });
      return combatResultDocs.map((doc: ICombatResultDocument) => this.documentToCombatResult(doc));
    } catch (error) {
      console.error('Error finding combat results by party ID:', error);
      return [];
    }
  }

  async findByDungeonId(dungeonId: string): Promise<ICombatResult[]> {
    try {
      const combatResultDocs: ICombatResultDocument[] = await CombatResultModel.find({ dungeonId }).sort({ createdAt: -1 });
      return combatResultDocs.map((doc: ICombatResultDocument) => this.documentToCombatResult(doc));
    } catch (error) {
      console.error('Error finding combat results by dungeon ID:', error);
      return [];
    }
  }

  async findByPlayerId(playerId: string): Promise<ICombatResult[]> {
    try {
      // This requires a join operation, for now we'll return empty array
      // In a real implementation, you'd need to join with Party collection
      console.warn('findByPlayerId not implemented - requires join with Party collection');
      return [];
    } catch (error) {
      console.error('Error finding combat results by player ID:', error);
      return [];
    }
  }

  async getRecentResults(limit: number = 10): Promise<ICombatResult[]> {
    try {
      const combatResultDocs: ICombatResultDocument[] = await CombatResultModel.find()
        .sort({ createdAt: -1 })
        .limit(limit);
      return combatResultDocs.map((doc: ICombatResultDocument) => this.documentToCombatResult(doc));
    } catch (error) {
      console.error('Error finding recent combat results:', error);
      return [];
    }
  }

  private documentToCombatResult(doc: ICombatResultDocument): ICombatResult {
    const totalRewards = new Reward(
      doc.totalRewards.gold,
      doc.totalRewards.experience,
      doc.totalRewards.items.map(itemData =>
        new Item(itemData.id, itemData.name, itemData.type, itemData.rarity, itemData.value)
      )
    );

    const battleResults: IBattleResult[] = doc.battleResults.map(battleResultData => ({
      id: battleResultData.id,
      battleId: battleResultData.battleId,
      partyId: battleResultData.partyId,
      dungeonId: battleResultData.dungeonId,
      victory: battleResultData.victory,
      duration: battleResultData.duration,
      rewards: new Reward(
        battleResultData.rewards.gold,
        battleResultData.rewards.experience,
        battleResultData.rewards.items.map(itemData =>
          new Item(itemData.id, itemData.name, itemData.type, itemData.rarity, itemData.value)
        )
      ),
      log: battleResultData.log,
      createdAt: battleResultData.createdAt
    }));

    return new CombatResult(
      (doc._id as any).toString(),
      doc.partyId,
      doc.dungeonId,
      doc.totalBattles,
      doc.victories,
      doc.totalDuration,
      totalRewards,
      battleResults,
      doc.createdAt
    );
  }
}