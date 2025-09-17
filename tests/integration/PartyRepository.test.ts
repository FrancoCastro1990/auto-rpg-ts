import { testConfig } from './IntegrationTestConfig';
import { Party } from '../../src/entities/Party';
import { Character } from '../../src/entities/Character';
import { Stats, Rule } from '../../src/entities/valueObjects';

describe('Party Repository Integration Tests', () => {
  beforeAll(async () => {
    await testConfig.setup();
  });

  afterAll(async () => {
    await testConfig.teardown();
  });

  beforeEach(async () => {
    await testConfig.clearDatabase();
  });

  describe('Party CRUD Operations', () => {
    it('should create and retrieve a party', async () => {
      const { party: partyRepo } = testConfig.getRepositories();

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
      expect(createdParty.id).toBe(testParty.id);
      expect(createdParty.name).toBe(testParty.name);
      expect(createdParty.characters).toHaveLength(1);

      // Retrieve party
      const retrievedParty = await partyRepo.findById(testParty.id);
      expect(retrievedParty).toBeDefined();
      expect(retrievedParty!.id).toBe(testParty.id);
      expect(retrievedParty!.name).toBe(testParty.name);
      expect(retrievedParty!.characters).toHaveLength(1);
      expect(retrievedParty!.characters[0]).toBeDefined();
      expect(retrievedParty!.characters[0].name).toBe('Warrior');
    });

    it('should update a party', async () => {
      const { party: partyRepo } = testConfig.getRepositories();

      // Create initial character
      const initialStats = new Stats(80, 30, 12, 10, 10, 8);
      const initialCharacter = new Character(
        'char-init',
        'Rookie',
        'Novice',
        1,
        initialStats,
        ['Basic Attack'],
        []
      );

      // Create initial party
      const initialParty = new Party(
        'test-party-2',
        'player-456',
        'Initial Party',
        [initialCharacter],
        new Date(),
        new Date()
      );

      await partyRepo.save(initialParty);

      // Create updated character
      const mageStats = new Stats(60, 80, 6, 8, 16, 10);
      const mageRules: Rule[] = [];
      const mage = new Character(
        'char-mage',
        'Mage',
        'Wizard',
        3,
        mageStats,
        ['Fireball', 'Heal'],
        mageRules
      );

      // Update party
      const updatedParty = new Party(
        initialParty.id,
        initialParty.playerId,
        'Updated Party Name',
        [mage],
        initialParty.createdAt,
        new Date()
      );

      const result = await partyRepo.update(updatedParty.id, {
        name: updatedParty.name,
        characters: updatedParty.characters,
        updatedAt: updatedParty.updatedAt
      });
      expect(result).toBeDefined();
      expect(result!.name).toBe('Updated Party Name');
      expect(result!.characters).toHaveLength(1);
      expect(result!.characters[0]).toBeDefined();
      expect(result!.characters[0].name).toBe('Mage');
    });

    it('should delete a party', async () => {
      const { party: partyRepo } = testConfig.getRepositories();

      // Create test character
      const testStats = new Stats(50, 50, 8, 8, 8, 8);
      const testCharacter = new Character(
        'char-delete',
        'TestChar',
        'TestJob',
        1,
        testStats,
        ['TestSkill'],
        []
      );

      // Create party
      const testParty = new Party(
        'test-party-3',
        'player-789',
        'Party to Delete',
        [testCharacter],
        new Date(),
        new Date()
      );

      await partyRepo.save(testParty);

      // Verify party exists
      const existingParty = await partyRepo.findById(testParty.id);
      expect(existingParty).toBeDefined();

      // Delete party
      const deleteResult = await partyRepo.delete(testParty.id);
      expect(deleteResult).toBe(true);

      // Verify party is deleted
      const deletedParty = await partyRepo.findById(testParty.id);
      expect(deletedParty).toBeNull();
    });

    it('should find all parties', async () => {
      const { party: partyRepo } = testConfig.getRepositories();

      // Create multiple parties
      const parties = [
        {
          id: 'party-1',
          playerId: 'player-1',
          name: 'Party One',
          characters: [new Character('char1', 'Char1', 'Job1', 1, new Stats(10,10,10,10,10,10), [], [])],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'party-2',
          playerId: 'player-2',
          name: 'Party Two',
          characters: [new Character('char2', 'Char2', 'Job2', 1, new Stats(10,10,10,10,10,10), [], [])],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'party-3',
          playerId: 'player-3',
          name: 'Party Three',
          characters: [new Character('char3', 'Char3', 'Job3', 1, new Stats(10,10,10,10,10,10), [], [])],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const partyData of parties) {
        const party = new Party(
          partyData.id,
          partyData.playerId,
          partyData.name,
          partyData.characters,
          partyData.createdAt,
          partyData.updatedAt
        );
        await partyRepo.save(party);
      }

      // Find all parties
      const allParties = await partyRepo.findAll();
      expect(allParties).toHaveLength(3);
      expect(allParties.map(p => p.name)).toEqual(
        expect.arrayContaining(['Party One', 'Party Two', 'Party Three'])
      );
    });

    it('should handle non-existent party', async () => {
      const { party: partyRepo } = testConfig.getRepositories();

      const nonExistentParty = await partyRepo.findById('non-existent-id');
      expect(nonExistentParty).toBeNull();
    });
  });
});