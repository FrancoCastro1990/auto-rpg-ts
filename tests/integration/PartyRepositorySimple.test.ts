import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Party } from '../../src/entities/Party';
import { Character } from '../../src/entities/Character';
import { Stats, Rule } from '../../src/entities/valueObjects';
import { PartyRepository } from '../../src/repositories/PartyRepository';

describe('Party Repository Integration Tests (Simplified)', () => {
  let mongoServer: MongoMemoryServer;
  let partyRepo: PartyRepository;

  beforeAll(async () => {
    // Disconnect any existing mongoose connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to test database
    await mongoose.connect(mongoUri);

    // Create repository instance
    partyRepo = new PartyRepository();
  }, 60000);

  afterAll(async () => {
    // Disconnect from database
    await mongoose.disconnect();

    // Stop MongoDB memory server
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 60000);

  beforeEach(async () => {
    // Clear all collections between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  });

  describe('Party CRUD Operations', () => {
    it('should create and retrieve a party', async () => {
      // Create test character
      const warriorStats = new Stats(100, 20, 15, 12, 8, 10);
      const warriorRules: Rule[] = [];
      const warrior = new Character(
        'char-1',
        'Warrior',
        'Fighter',
        5,
        warriorStats,
        ['Slash', 'Defend'],
        warriorRules
      );

      // Create test party data
      const testParty = new Party(
        'test-party-1',
        'player-123',
        'Test Adventurers',
        [warrior],
        new Date(),
        new Date()
      );

      // Create party
      const createdParty = await partyRepo.save(testParty);
      expect(createdParty).toBeDefined();
      expect(createdParty.name).toBe(testParty.name);
      expect(createdParty.characters).toHaveLength(1);

      // Use the ID returned by MongoDB (not the original ID)
      const partyId = createdParty.id;

      // Retrieve party using the MongoDB-generated ID
      const retrievedParty = await partyRepo.findById(partyId);
      expect(retrievedParty).toBeDefined();
      expect(retrievedParty!.id).toBe(partyId);
      expect(retrievedParty!.name).toBe(testParty.name);
      expect(retrievedParty!.characters).toHaveLength(1);
      expect(retrievedParty!.characters[0]).toBeDefined();
      if (retrievedParty!.characters[0]) {
        expect(retrievedParty!.characters[0].name).toBe('Warrior');
      }
    });

    it('should handle non-existent party', async () => {
      const nonExistentParty = await partyRepo.findById('non-existent-id');
      expect(nonExistentParty).toBeNull();
    });
  });
});