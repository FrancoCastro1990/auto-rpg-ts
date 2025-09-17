import { EntityFactoryDomainService } from '../../src/domain/services/EntityFactoryDomainService';
import { EntityFactory } from '../../src/loaders/EntityFactory';
import { BattleLogger } from '../../src/utils/BattleLogger';

jest.mock('../../src/loaders/EntityFactory');
jest.mock('../../src/utils/BattleLogger');

describe('EntityFactoryDomainService', () => {
  let entityFactoryDomainService: EntityFactoryDomainService;
  let mockEntityFactory: jest.Mocked<EntityFactory>;
  let mockLogger: jest.Mocked<BattleLogger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockEntityFactory = {
      createCharacter: jest.fn(),
      createEnemy: jest.fn(),
      createEnemiesFromBattle: jest.fn(),
      getSkillByName: jest.fn(),
      getSkillById: jest.fn(),
      getJobDetails: jest.fn(),
      getEnemyDetails: jest.fn(),
      validateSkillReferences: jest.fn(),
      listAvailableJobs: jest.fn(),
      listAvailableEnemies: jest.fn(),
      listAvailableSkills: jest.fn()
    } as any;

    mockLogger = {
      logDebug: jest.fn(),
      logError: jest.fn(),
      logWarning: jest.fn(),
      log: jest.fn()
    } as any;

    // Mock constructors
    (EntityFactory as jest.MockedClass<typeof EntityFactory>).mockImplementation(() => mockEntityFactory);

    // Create service instance with mock data
    const mockSkills: any[] = [];
    const mockJobs: any[] = [];
    const mockEnemies: any[] = [];
    entityFactoryDomainService = new EntityFactoryDomainService(mockSkills, mockJobs, mockEnemies, mockLogger);
  });

  describe('createCharacter', () => {
    it('should create character successfully', () => {
      // Arrange
      const request = {
        member: {
          name: 'Hero',
          job: 'warrior',
          level: 1,
          rules: []
        }
      };

      const expectedCharacter = global.testUtils.createMockParticipant({
        name: 'Hero',
        job: 'warrior',
        level: 1
      });

      mockEntityFactory.createCharacter.mockReturnValue(expectedCharacter);

      // Act
      const result = entityFactoryDomainService.createCharacter(request);

      // Assert
      expect(mockEntityFactory.createCharacter).toHaveBeenCalledWith(request.member);
      expect(result.character).toEqual(expectedCharacter);
      expect(result.creationTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle character creation errors', () => {
      // Arrange
      const request = {
        member: {
          name: 'Hero',
          job: 'warrior',
          level: 1,
          rules: []
        }
      };

      mockEntityFactory.createCharacter.mockImplementation(() => {
        throw new Error('Invalid job type');
      });

      // Act & Assert
      expect(() => entityFactoryDomainService.createCharacter(request)).toThrow('Character creation failed: Invalid job type');
    });
  });

  describe('createEnemy', () => {
    it('should create enemy successfully', () => {
      // Arrange
      const request = {
        enemyType: 'goblin',
        name: 'Goblin Warrior',
        level: 1
      };

      const expectedEnemy = global.testUtils.createMockParticipant({
        name: 'Goblin Warrior',
        job: 'goblin',
        level: 1,
        isEnemy: true
      });

      mockEntityFactory.createEnemy.mockReturnValue(expectedEnemy as any);

      // Act
      const result = entityFactoryDomainService.createEnemy(request);

      // Assert
      expect(mockEntityFactory.createEnemy).toHaveBeenCalledWith('goblin', 'Goblin Warrior', 1);
      expect(result.enemy).toEqual(expectedEnemy);
      expect(result.creationTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle enemy creation errors', () => {
      // Arrange
      const request = {
        enemyType: 'dragon',
        name: 'Ancient Dragon',
        level: 10
      };

      mockEntityFactory.createEnemy.mockImplementation(() => {
        throw new Error('Enemy type not found');
      });

      // Act & Assert
      expect(() => entityFactoryDomainService.createEnemy(request)).toThrow('Enemy creation failed: Enemy type not found');
    });

    it('should use default level when not provided', () => {
      // Arrange
      const request = {
        enemyType: 'goblin',
        name: 'Goblin'
      };

      const expectedEnemy = global.testUtils.createMockParticipant({
        name: 'Goblin',
        job: 'goblin',
        level: 1,
        isEnemy: true
      });

      mockEntityFactory.createEnemy.mockReturnValue(expectedEnemy as any);

      // Act
      const result = entityFactoryDomainService.createEnemy(request);

      // Assert
      expect(mockEntityFactory.createEnemy).toHaveBeenCalledWith('goblin', 'Goblin', undefined);
    });
  });

  describe('createEnemiesFromBattle', () => {
    it('should create multiple enemies successfully', () => {
      // Arrange
      const request = {
        battleEnemies: [
          { type: 'goblin', name: 'Goblin 1' },
          { type: 'orc', name: 'Orc 1' }
        ],
        level: 2
      };

      const expectedEnemies = [
        global.testUtils.createMockParticipant({ name: 'Goblin 1', job: 'goblin', level: 2, isEnemy: true }),
        global.testUtils.createMockParticipant({ name: 'Orc 1', job: 'orc', level: 2, isEnemy: true })
      ];

      mockEntityFactory.createEnemiesFromBattle.mockReturnValue(expectedEnemies as any);

      // Act
      const result = entityFactoryDomainService.createEnemiesFromBattle(request);

      // Assert
      expect(mockEntityFactory.createEnemiesFromBattle).toHaveBeenCalledWith(request.battleEnemies, 2);
      expect(result.enemies).toEqual(expectedEnemies);
      expect(result.creationTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple enemies creation errors', () => {
      // Arrange
      const request = {
        battleEnemies: [
          { type: 'invalid_enemy' }
        ],
        level: 1
      };

      mockEntityFactory.createEnemiesFromBattle.mockImplementation(() => {
        throw new Error('Invalid enemy type');
      });

      // Act & Assert
      expect(() => entityFactoryDomainService.createEnemiesFromBattle(request)).toThrow('Multiple enemies creation failed: Invalid enemy type');
    });
  });

  describe('getSkill', () => {
    it('should find skill by name', () => {
      // Arrange
      const request = {
        skillName: 'Fireball'
      };

      const expectedSkill = {
        id: 'fireball',
        name: 'Fireball',
        type: 'attack' as const,
        effect: { damage: 25 },
        mpCost: 10,
        cooldown: 2
      };

      mockEntityFactory.getSkillByName.mockReturnValue(expectedSkill);

      // Act
      const result = entityFactoryDomainService.getSkill(request);

      // Assert
      expect(mockEntityFactory.getSkillByName).toHaveBeenCalledWith('Fireball');
      expect(result.skill).toEqual(expectedSkill);
      expect(result.found).toBe(true);
    });

    it('should find skill by id', () => {
      // Arrange
      const request = {
        skillId: 'fireball'
      };

      const expectedSkill = {
        id: 'fireball',
        name: 'Fireball',
        type: 'attack' as const,
        effect: { damage: 25 },
        mpCost: 10,
        cooldown: 2
      };

      mockEntityFactory.getSkillById.mockReturnValue(expectedSkill);

      // Act
      const result = entityFactoryDomainService.getSkill(request);

      // Assert
      expect(mockEntityFactory.getSkillById).toHaveBeenCalledWith('fireball');
      expect(result.skill).toEqual(expectedSkill);
      expect(result.found).toBe(true);
    });

    it('should return not found when skill does not exist', () => {
      // Arrange
      const request = {
        skillName: 'NonExistentSkill'
      };

      mockEntityFactory.getSkillByName.mockReturnValue(undefined);

      // Act
      const result = entityFactoryDomainService.getSkill(request);

      // Assert
      expect(result.skill).toBeUndefined();
      expect(result.found).toBe(false);
    });
  });

  describe('getJob', () => {
    it('should find job successfully', () => {
      // Arrange
      const request = {
        jobName: 'warrior'
      };

      const expectedJob = {
        name: 'warrior',
        baseStats: { hp: 100, mp: 20, str: 15, def: 12, mag: 5, spd: 8 },
        skillIds: ['power_attack', 'defend'],
        description: 'Strong melee fighter'
      };

      mockEntityFactory.getJobDetails.mockReturnValue(expectedJob);

      // Act
      const result = entityFactoryDomainService.getJob(request);

      // Assert
      expect(mockEntityFactory.getJobDetails).toHaveBeenCalledWith('warrior');
      expect(result.job).toEqual(expectedJob);
      expect(result.found).toBe(true);
    });

    it('should return not found when job does not exist', () => {
      // Arrange
      const request = {
        jobName: 'invalid_job'
      };

      mockEntityFactory.getJobDetails.mockReturnValue(undefined);

      // Act
      const result = entityFactoryDomainService.getJob(request);

      // Assert
      expect(result.job).toBeUndefined();
      expect(result.found).toBe(false);
    });
  });

  describe('getEnemyTemplate', () => {
    it('should find enemy template successfully', () => {
      // Arrange
      const request = {
        enemyType: 'goblin'
      };

      const expectedEnemy = {
        type: 'goblin',
        job: 'warrior',
        baseStats: { hp: 50, mp: 10, str: 8, def: 6, mag: 3, spd: 12 },
        rules: [],
        skillIds: ['attack'],
        isBoss: false,
        description: 'Small green creature'
      };

      mockEntityFactory.getEnemyDetails.mockReturnValue(expectedEnemy);

      // Act
      const result = entityFactoryDomainService.getEnemyTemplate(request);

      // Assert
      expect(mockEntityFactory.getEnemyDetails).toHaveBeenCalledWith('goblin');
      expect(result.enemy).toEqual(expectedEnemy);
      expect(result.found).toBe(true);
    });

    it('should return not found when enemy template does not exist', () => {
      // Arrange
      const request = {
        enemyType: 'invalid_enemy'
      };

      mockEntityFactory.getEnemyDetails.mockReturnValue(undefined);

      // Act
      const result = entityFactoryDomainService.getEnemyTemplate(request);

      // Assert
      expect(result.enemy).toBeUndefined();
      expect(result.found).toBe(false);
    });
  });

  describe('validateSkillReferences', () => {
    it('should validate skill references successfully', () => {
      // Arrange
      const request = {
        skillIds: ['fireball', 'heal', 'power_attack']
      };

      const expectedValidation = {
        valid: ['fireball', 'heal', 'power_attack'],
        invalid: []
      };

      mockEntityFactory.validateSkillReferences.mockReturnValue(expectedValidation);

      // Act
      const result = entityFactoryDomainService.validateSkillReferences(request);

      // Assert
      expect(mockEntityFactory.validateSkillReferences).toHaveBeenCalledWith(request.skillIds);
      expect(result.valid).toEqual(['fireball', 'heal', 'power_attack']);
      expect(result.invalid).toEqual([]);
    });

    it('should handle invalid skill references', () => {
      // Arrange
      const request = {
        skillIds: ['fireball', 'invalid_skill', 'heal', 'another_invalid']
      };

      const expectedValidation = {
        valid: ['fireball', 'heal'],
        invalid: ['invalid_skill', 'another_invalid']
      };

      mockEntityFactory.validateSkillReferences.mockReturnValue(expectedValidation);

      // Act
      const result = entityFactoryDomainService.validateSkillReferences(request);

      // Assert
      expect(result.valid).toEqual(['fireball', 'heal']);
      expect(result.invalid).toEqual(['invalid_skill', 'another_invalid']);
    });
  });

  describe('listEntities', () => {
    it('should list jobs successfully', () => {
      // Arrange
      const request = {
        type: 'jobs' as const
      };

      const expectedJobs = ['warrior', 'mage', 'cleric', 'rogue'];

      mockEntityFactory.listAvailableJobs.mockReturnValue(expectedJobs);

      // Act
      const result = entityFactoryDomainService.listEntities(request);

      // Assert
      expect(mockEntityFactory.listAvailableJobs).toHaveBeenCalled();
      expect(result.items).toEqual(expectedJobs);
      expect(result.count).toBe(4);
    });

    it('should list enemies successfully', () => {
      // Arrange
      const request = {
        type: 'enemies' as const
      };

      const expectedEnemies = ['goblin', 'orc', 'skeleton', 'dragon'];

      mockEntityFactory.listAvailableEnemies.mockReturnValue(expectedEnemies);

      // Act
      const result = entityFactoryDomainService.listEntities(request);

      // Assert
      expect(mockEntityFactory.listAvailableEnemies).toHaveBeenCalled();
      expect(result.items).toEqual(expectedEnemies);
      expect(result.count).toBe(4);
    });

    it('should list skills successfully', () => {
      // Arrange
      const request = {
        type: 'skills' as const
      };

      const expectedSkills = ['fireball', 'heal', 'power_attack', 'defend'];

      mockEntityFactory.listAvailableSkills.mockReturnValue(expectedSkills);

      // Act
      const result = entityFactoryDomainService.listEntities(request);

      // Assert
      expect(mockEntityFactory.listAvailableSkills).toHaveBeenCalled();
      expect(result.items).toEqual(expectedSkills);
      expect(result.count).toBe(4);
    });

    it('should handle invalid entity type', () => {
      // Arrange
      const request = {
        type: 'invalid' as any
      };

      // Act
      const result = entityFactoryDomainService.listEntities(request);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('getEntityFactory', () => {
    it('should return the underlying EntityFactory instance', () => {
      // Act
      const result = entityFactoryDomainService.getEntityFactory();

      // Assert
      expect(result).toBe(mockEntityFactory);
    });
  });
});