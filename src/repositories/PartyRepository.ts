// Concrete implementation of PartyRepository using Mongoose
import { IPartyRepository } from './interfaces';
import { IParty, ICharacter } from '../entities/interfaces';
import { PartyModel, IPartyDocument } from '../infrastructure/models/Party';
import { Party } from '../entities/Party';
import { Character } from '../entities/Character';
import { Stats, Rule } from '../entities/valueObjects';

export class PartyRepository implements IPartyRepository {
  async findById(id: string): Promise<IParty | null> {
    try {
      const partyDoc = await PartyModel.findById(id);
      if (!partyDoc) return null;

      return this.documentToParty(partyDoc);
    } catch (error) {
      console.error('Error finding party by ID:', error);
      return null;
    }
  }

  async findAll(): Promise<IParty[]> {
    try {
      const partyDocs: IPartyDocument[] = await PartyModel.find().sort({ createdAt: -1 });
      return partyDocs.map((doc: IPartyDocument) => this.documentToParty(doc));
    } catch (error) {
      console.error('Error finding all parties:', error);
      return [];
    }
  }

  async save(party: IParty): Promise<IParty> {
    try {
      const partyData = {
        playerId: party.playerId,
        name: party.name,
        characters: party.characters.map(char => ({
          id: char.id,
          name: char.name,
          job: char.job,
          level: char.level,
          stats: char.stats,
          skills: char.skills,
          rules: char.rules.map(rule => ({
            id: rule.id,
            priority: rule.priority,
            condition: rule.condition,
            target: rule.target,
            action: rule.action
          }))
        })),
        createdAt: party.createdAt,
        updatedAt: party.updatedAt
      };

      const partyDoc = new PartyModel(partyData);
      const savedDoc = await partyDoc.save();

      return this.documentToParty(savedDoc);
    } catch (error) {
      console.error('Error saving party:', error);
      throw new Error('Failed to save party');
    }
  }

  async update(id: string, updates: Partial<IParty>): Promise<IParty | null> {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.characters) {
        updateData.characters = updates.characters.map(char => ({
          id: char.id,
          name: char.name,
          job: char.job,
          level: char.level,
          stats: char.stats,
          skills: char.skills,
          rules: char.rules.map(rule => ({
            id: rule.id,
            priority: rule.priority,
            condition: rule.condition,
            target: rule.target,
            action: rule.action
          }))
        }));
      }
      if (updates.updatedAt) updateData.updatedAt = updates.updatedAt;

      const updatedDoc = await PartyModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedDoc) return null;

      return this.documentToParty(updatedDoc);
    } catch (error) {
      console.error('Error updating party:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await PartyModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Error deleting party:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await PartyModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      console.error('Error checking party existence:', error);
      return false;
    }
  }

  async findByPlayerId(playerId: string): Promise<IParty[]> {
    try {
      const partyDocs: IPartyDocument[] = await PartyModel.find({ playerId }).sort({ createdAt: -1 });
      return partyDocs.map((doc: IPartyDocument) => this.documentToParty(doc));
    } catch (error) {
      console.error('Error finding parties by player ID:', error);
      return [];
    }
  }

  async findActiveParties(): Promise<IParty[]> {
    try {
      // Consider active parties as those created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const partyDocs: IPartyDocument[] = await PartyModel.find({
        createdAt: { $gte: thirtyDaysAgo }
      }).sort({ createdAt: -1 });

      return partyDocs.map((doc: IPartyDocument) => this.documentToParty(doc));
    } catch (error) {
      console.error('Error finding active parties:', error);
      return [];
    }
  }

  async updateCharacters(id: string, characters: ICharacter[]): Promise<IParty | null> {
    try {
      const updateData = {
        characters: characters.map(char => ({
          id: char.id,
          name: char.name,
          job: char.job,
          level: char.level,
          stats: char.stats,
          skills: char.skills,
          rules: char.rules.map(rule => ({
            id: rule.id,
            priority: rule.priority,
            condition: rule.condition,
            target: rule.target,
            action: rule.action
          }))
        })),
        updatedAt: new Date()
      };

      const updatedDoc = await PartyModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedDoc) return null;

      return this.documentToParty(updatedDoc);
    } catch (error) {
      console.error('Error updating party characters:', error);
      return null;
    }
  }

  async countByPlayerId(playerId: string): Promise<number> {
    try {
      return await PartyModel.countDocuments({ playerId });
    } catch (error) {
      console.error('Error counting parties by player ID:', error);
      return 0;
    }
  }

  private documentToParty(doc: IPartyDocument): IParty {
    const characters = doc.characters.map(charData => {
      const rules = charData.rules.map(ruleData =>
        new Rule(ruleData.id, ruleData.priority, ruleData.condition, ruleData.target, ruleData.action)
      );

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
        charData.skills,
        rules
      );
    });

    return new Party(
      (doc._id as any).toString(),
      doc.playerId,
      doc.name,
      characters,
      doc.createdAt,
      doc.updatedAt
    );
  }
}