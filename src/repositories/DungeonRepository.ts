// Concrete implementation of DungeonRepository using Mongoose
import { IDungeonRepository } from './interfaces';
import { IDungeon, IBattleResult } from '../entities/interfaces';
import { DungeonModel, IDungeonDocument } from '../infrastructure/models/Dungeon';
import { Dungeon } from '../entities/Dungeon';
import { Item } from '../entities/valueObjects';

export class DungeonRepository implements IDungeonRepository {
  async findById(id: string): Promise<IDungeon | null> {
    try {
      const dungeonDoc = await DungeonModel.findById(id);
      if (!dungeonDoc) return null;

      return this.documentToDungeon(dungeonDoc);
    } catch (error) {
      console.error('Error finding dungeon by ID:', error);
      return null;
    }
  }

  async findAll(): Promise<IDungeon[]> {
    try {
      const dungeonDocs: IDungeonDocument[] = await DungeonModel.find().sort({ createdAt: -1 });
      return dungeonDocs.map((doc: IDungeonDocument) => this.documentToDungeon(doc));
    } catch (error) {
      console.error('Error finding all dungeons:', error);
      return [];
    }
  }

  async save(dungeon: IDungeon): Promise<IDungeon> {
    try {
      const dungeonData = {
        name: dungeon.name,
        description: dungeon.description,
        difficulty: dungeon.difficulty,
        minLevel: dungeon.minLevel,
        battles: dungeon.battles,
        createdAt: dungeon.createdAt,
        updatedAt: dungeon.updatedAt
      };

      const dungeonDoc = new DungeonModel(dungeonData);
      const savedDoc = await dungeonDoc.save();

      return this.documentToDungeon(savedDoc);
    } catch (error) {
      console.error('Error saving dungeon:', error);
      throw new Error('Failed to save dungeon');
    }
  }

  async update(id: string, updates: Partial<IDungeon>): Promise<IDungeon | null> {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.difficulty) updateData.difficulty = updates.difficulty;
      if (updates.minLevel) updateData.minLevel = updates.minLevel;
      if (updates.battles) updateData.battles = updates.battles;
      if (updates.updatedAt) updateData.updatedAt = updates.updatedAt;

      const updatedDoc = await DungeonModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedDoc) return null;

      return this.documentToDungeon(updatedDoc);
    } catch (error) {
      console.error('Error updating dungeon:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await DungeonModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Error deleting dungeon:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await DungeonModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      console.error('Error checking dungeon existence:', error);
      return false;
    }
  }

  async findByDifficulty(difficulty: number): Promise<IDungeon[]> {
    try {
      const dungeonDocs: IDungeonDocument[] = await DungeonModel.find({ difficulty }).sort({ createdAt: -1 });
      return dungeonDocs.map((doc: IDungeonDocument) => this.documentToDungeon(doc));
    } catch (error) {
      console.error('Error finding dungeons by difficulty:', error);
      return [];
    }
  }

  async findByName(name: string): Promise<IDungeon | null> {
    try {
      const dungeonDoc = await DungeonModel.findOne({ name: new RegExp(name, 'i') });
      if (!dungeonDoc) return null;

      return this.documentToDungeon(dungeonDoc);
    } catch (error) {
      console.error('Error finding dungeon by name:', error);
      return null;
    }
  }

  async findAvailableForPlayer(playerLevel: number): Promise<IDungeon[]> {
    try {
      const dungeonDocs: IDungeonDocument[] = await DungeonModel.find({
        minLevel: { $lte: playerLevel }
      }).sort({ difficulty: 1, createdAt: -1 });

      return dungeonDocs.map((doc: IDungeonDocument) => this.documentToDungeon(doc));
    } catch (error) {
      console.error('Error finding available dungeons for player:', error);
      return [];
    }
  }

  async updateBattleResults(id: string, battleResults: IBattleResult[]): Promise<IDungeon | null> {
    try {
      // This method might be used to update dungeon statistics or results
      // For now, we'll just update the updatedAt timestamp
      const updatedDoc = await DungeonModel.findByIdAndUpdate(
        id,
        { updatedAt: new Date() },
        { new: true }
      );

      if (!updatedDoc) return null;

      return this.documentToDungeon(updatedDoc);
    } catch (error) {
      console.error('Error updating dungeon battle results:', error);
      return null;
    }
  }

  private documentToDungeon(doc: IDungeonDocument): IDungeon {
    // Convert MongoDB battles to domain battles
    const battles: any[] = doc.battles.map(battle => ({
      id: battle.id,
      enemies: battle.enemies.map((enemy: any) => ({
        id: enemy.id,
        name: enemy.name,
        job: 'Enemy', // Default job for enemies
        level: enemy.level,
        stats: enemy.stats,
        skills: enemy.skills,
        rules: [] // Enemies don't have rules initially
      })),
      rewards: battle.rewards,
      order: battle.order
    }));

    return new Dungeon(
      (doc._id as any).toString(),
      doc.name,
      doc.description,
      doc.difficulty,
      doc.minLevel,
      battles,
      doc.createdAt,
      doc.updatedAt
    );
  }
}