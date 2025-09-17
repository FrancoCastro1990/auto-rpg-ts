// Concrete implementation of PlayerRepository using Mongoose
import { IPlayerRepository } from './interfaces';
import { IPlayer } from '../entities/interfaces';
import { PlayerModel, IPlayerDocument } from '../infrastructure/models/Player';
import { Player } from '../entities/Player';
import { Experience } from '../entities/valueObjects';

export class PlayerRepository implements IPlayerRepository {
  async findById(id: string): Promise<IPlayer | null> {
    try {
      const playerDoc = await PlayerModel.findById(id);
      if (!playerDoc) return null;

      return Player.fromJSON({
        id: (playerDoc._id as any).toString(),
        username: playerDoc.username,
        level: playerDoc.level,
        experience: playerDoc.experience,
        createdAt: playerDoc.createdAt,
        updatedAt: playerDoc.updatedAt
      });
    } catch (error) {
      console.error('Error finding player by ID:', error);
      return null;
    }
  }

  async findAll(): Promise<IPlayer[]> {
    try {
      const playerDocs: IPlayerDocument[] = await PlayerModel.find().sort({ createdAt: -1 });
      return playerDocs.map((doc: IPlayerDocument) => Player.fromJSON({
        id: (doc._id as any).toString(),
        username: doc.username,
        level: doc.level,
        experience: doc.experience,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
    } catch (error) {
      console.error('Error finding all players:', error);
      return [];
    }
  }

  async save(player: IPlayer): Promise<IPlayer> {
    try {
      const playerData = {
        username: player.username,
        level: player.level,
        experience: player.experience,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt
      };

      const playerDoc = new PlayerModel(playerData);
      const savedDoc = await playerDoc.save();

      return Player.fromJSON({
        id: (savedDoc._id as any).toString(),
        username: savedDoc.username,
        level: savedDoc.level,
        experience: savedDoc.experience,
        createdAt: savedDoc.createdAt,
        updatedAt: savedDoc.updatedAt
      });
    } catch (error) {
      console.error('Error saving player:', error);
      throw new Error('Failed to save player');
    }
  }

  async update(id: string, updates: Partial<IPlayer>): Promise<IPlayer | null> {
    try {
      const updateData: any = {};

      if (updates.username) updateData.username = updates.username;
      if (updates.level) updateData.level = updates.level;
      if (updates.experience) updateData.experience = updates.experience;
      if (updates.updatedAt) updateData.updatedAt = updates.updatedAt;

      const updatedDoc = await PlayerModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedDoc) return null;

      return Player.fromJSON({
        id: (updatedDoc._id as any).toString(),
        username: updatedDoc.username,
        level: updatedDoc.level,
        experience: updatedDoc.experience,
        createdAt: updatedDoc.createdAt,
        updatedAt: updatedDoc.updatedAt
      });
    } catch (error) {
      console.error('Error updating player:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await PlayerModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Error deleting player:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await PlayerModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      console.error('Error checking player existence:', error);
      return false;
    }
  }

  async findByUsername(username: string): Promise<IPlayer | null> {
    try {
      const playerDoc = await PlayerModel.findOne({ username });
      if (!playerDoc) return null;

      return Player.fromJSON({
        id: (playerDoc._id as any).toString(),
        username: playerDoc.username,
        level: playerDoc.level,
        experience: playerDoc.experience,
        createdAt: playerDoc.createdAt,
        updatedAt: playerDoc.updatedAt
      });
    } catch (error) {
      console.error('Error finding player by username:', error);
      return null;
    }
  }

  async updateExperience(id: string, experience: number): Promise<IPlayer | null> {
    try {
      const player = await this.findById(id);
      if (!player) return null;

      // Create Player instance to use gainExperience method
      const playerEntity = new Player(
        player.id,
        player.username,
        player.level,
        new Experience(
          player.experience.current,
          player.experience.nextLevel,
          player.experience.total
        ),
        player.createdAt,
        player.updatedAt
      );

      const updatedPlayer = playerEntity.gainExperience(experience);
      return await this.update(id, updatedPlayer);
    } catch (error) {
      console.error('Error updating player experience:', error);
      return null;
    }
  }

  async findByLevel(level: number): Promise<IPlayer[]> {
    try {
      const playerDocs: IPlayerDocument[] = await PlayerModel.find({ level }).sort({ createdAt: -1 });
      return playerDocs.map((doc: IPlayerDocument) => Player.fromJSON({
        id: (doc._id as any).toString(),
        username: doc.username,
        level: doc.level,
        experience: doc.experience,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
    } catch (error) {
      console.error('Error finding players by level:', error);
      return [];
    }
  }

  async getLeaderboard(limit: number = 10): Promise<IPlayer[]> {
    try {
      const playerDocs: IPlayerDocument[] = await PlayerModel.find()
        .sort({ level: -1, 'experience.total': -1 })
        .limit(limit);

      return playerDocs.map((doc: IPlayerDocument) => Player.fromJSON({
        id: (doc._id as any).toString(),
        username: doc.username,
        level: doc.level,
        experience: doc.experience,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
}