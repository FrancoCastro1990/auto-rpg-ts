import { RulesEngineDomainService } from '../../src/domain/services/RulesEngineDomainService';
import { RulesEngine } from '../../src/systems/RulesEngine';
import { BattleLogger } from '../../src/utils/BattleLogger';

jest.mock('../../src/systems/RulesEngine');
jest.mock('../../src/utils/BattleLogger');

describe('RulesEngineDomainService', () => {
  let rulesEngineDomainService: RulesEngineDomainService;
  let mockRulesEngine: jest.Mocked<RulesEngine>;
  let mockLogger: jest.Mocked<BattleLogger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockRulesEngine = {
      evaluateRules: jest.fn(),
      selectBestAction: jest.fn(),
      validateRule: jest.fn(),
      validateAllRules: jest.fn(),
      testRule: jest.fn()
    } as any;

    mockLogger = {
      logDebug: jest.fn(),
      logError: jest.fn(),
      logWarning: jest.fn(),
      log: jest.fn()
    } as any;

    // Mock constructors
    (RulesEngine as jest.MockedClass<typeof RulesEngine>).mockImplementation(() => mockRulesEngine);

    // Create service instance
    rulesEngineDomainService = new RulesEngineDomainService(mockLogger);
  });

  describe('evaluateRules', () => {
    it('should evaluate rules successfully', async () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({
          name: 'Hero',
          rules: [{ priority: 1, condition: 'always', target: 'weakestEnemy', action: 'attack' }]
        }),
        allies: [global.testUtils.createMockParticipant({ name: 'Hero' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Goblin', isEnemy: true })]
      };

      const mockResults = [
        {
          rule: { priority: 1, condition: 'always', target: 'weakestEnemy', action: 'attack' },
          priority: 1,
          target: 'goblin-1',
          action: 'attack',
          success: true
        }
      ];

      const mockBestAction = {
        rule: { priority: 1, condition: 'always', target: 'weakestEnemy', action: 'attack' },
        priority: 1,
        target: 'goblin-1',
        action: 'attack',
        success: true
      };

      mockRulesEngine.evaluateRules.mockResolvedValue(mockResults);
      mockRulesEngine.selectBestAction.mockResolvedValue(mockBestAction);

      // Act
      const result = await rulesEngineDomainService.evaluateRules(request);

      // Assert
      expect(mockRulesEngine.evaluateRules).toHaveBeenCalledWith(
        request.actor,
        request.allies,
        request.enemies
      );
      expect(mockRulesEngine.selectBestAction).toHaveBeenCalledWith(
        request.actor,
        request.allies,
        request.enemies
      );
      expect(result.results).toEqual(mockResults);
      expect(result.bestAction).toEqual(mockBestAction);
      expect(result.facts).toBeDefined();
      expect(result.evaluationTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle evaluation errors', async () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({
          rules: [{ priority: 1, condition: 'always', target: 'weakestEnemy', action: 'attack' }]
        }),
        allies: [global.testUtils.createMockParticipant()],
        enemies: [global.testUtils.createMockParticipant({ isEnemy: true })]
      };

      mockRulesEngine.evaluateRules.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(rulesEngineDomainService.evaluateRules(request)).rejects.toThrow('Rules evaluation failed: Database connection failed');
    });

    it('should validate input parameters', async () => {
      // Arrange
      const invalidRequest = {
        actor: global.testUtils.createMockParticipant({ rules: [] }), // Empty rules array
        allies: [global.testUtils.createMockParticipant()],
        enemies: [global.testUtils.createMockParticipant({ isEnemy: true })]
      };

      // Act & Assert
      await expect(rulesEngineDomainService.evaluateRules(invalidRequest)).rejects.toThrow('Actor must have at least one rule');
    });
  });

  describe('validateRule', () => {
    it('should validate a rule successfully', () => {
      // Arrange
      const request = {
        rule: {
          priority: 1,
          condition: 'always',
          target: 'weakestEnemy',
          action: 'attack'
        }
      };

      const expectedValidation = {
        valid: true,
        errors: []
      };

      mockRulesEngine.validateRule.mockReturnValue(expectedValidation);

      // Act
      const result = rulesEngineDomainService.validateRule(request);

      // Assert
      expect(mockRulesEngine.validateRule).toHaveBeenCalledWith(request.rule);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle invalid rules', () => {
      // Arrange
      const request = {
        rule: {
          priority: 1,
          condition: 'invalid.condition',
          target: 'invalidTarget',
          action: 'invalidAction'
        }
      };

      const expectedValidation = {
        valid: false,
        errors: ['Invalid condition', 'Invalid target', 'Invalid action']
      };

      mockRulesEngine.validateRule.mockReturnValue(expectedValidation);

      // Act
      const result = rulesEngineDomainService.validateRule(request);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid condition');
    });
  });

  describe('validateRules', () => {
    it('should validate multiple rules successfully', () => {
      // Arrange
      const request = {
        rules: [
          {
            priority: 1,
            condition: 'always',
            target: 'weakestEnemy',
            action: 'attack'
          },
          {
            priority: 2,
            condition: 'self.mp > 50%',
            target: 'randomEnemy',
            action: 'cast:fireball'
          }
        ]
      };

      const expectedValidation = {
        valid: true,
        ruleErrors: []
      };

      mockRulesEngine.validateAllRules.mockReturnValue(expectedValidation);

      // Act
      const result = rulesEngineDomainService.validateRules(request);

      // Assert
      expect(mockRulesEngine.validateAllRules).toHaveBeenCalledWith(request.rules);
      expect(result.valid).toBe(true);
      expect(result.ruleErrors).toEqual([]);
    });

    it('should handle validation errors for multiple rules', () => {
      // Arrange
      const request = {
        rules: [
          {
            priority: 1,
            condition: 'always',
            target: 'weakestEnemy',
            action: 'attack'
          },
          {
            priority: 2,
            condition: 'invalid.condition',
            target: 'invalidTarget',
            action: 'invalidAction'
          }
        ]
      };

      const expectedValidation = {
        valid: false,
        ruleErrors: [
          {
            rule: request.rules[1],
            errors: ['Invalid condition', 'Invalid target']
          }
        ]
      };

      mockRulesEngine.validateAllRules.mockReturnValue(expectedValidation as any);

      // Act
      const result = rulesEngineDomainService.validateRules(request);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.ruleErrors).toHaveLength(1);
      expect(result.ruleErrors[0]?.errors).toContain('Invalid condition');
    });
  });

  describe('testRule', () => {
    it('should test a rule successfully', async () => {
      // Arrange
      const request = {
        rule: {
          priority: 1,
          condition: 'always',
          target: 'weakestEnemy',
          action: 'attack'
        },
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [global.testUtils.createMockParticipant({ name: 'Hero' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Goblin', isEnemy: true })]
      };

      const mockTestResult = {
        triggered: true,
        facts: {
          actor: {
            id: 'hero-1',
            name: 'Hero',
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            hpPercentage: 100,
            mpPercentage: 100,
            isAlive: true,
            isEnemy: false,
            isBoss: false
          },
          allies: [],
          enemies: [],
          allyCount: 1,
          enemyCount: 1,
          livingAllies: 1,
          livingEnemies: 1,
          hasBossEnemy: false,
          lowestAllyHpPercentage: 100,
          always: true
        }
      };

      mockRulesEngine.testRule.mockResolvedValue(mockTestResult);

      // Act
      const result = await rulesEngineDomainService.testRule(request);

      // Assert
      expect(mockRulesEngine.testRule).toHaveBeenCalledWith(
        request.rule,
        request.actor,
        request.allies,
        request.enemies
      );
      expect(result.triggered).toBe(true);
      expect(result.facts).toBeDefined();
      expect(result.testTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle rule test errors', async () => {
      // Arrange
      const request = {
        rule: {
          priority: 1,
          condition: 'always',
          target: 'weakestEnemy',
          action: 'attack'
        },
        actor: global.testUtils.createMockParticipant(),
        allies: [global.testUtils.createMockParticipant()],
        enemies: [global.testUtils.createMockParticipant({ isEnemy: true })]
      };

      mockRulesEngine.testRule.mockRejectedValue(new Error('Test failed'));

      // Act & Assert
      await expect(rulesEngineDomainService.testRule(request)).rejects.toThrow('Rule test failed: Test failed');
    });
  });

  describe('getBattleFacts', () => {
    it('should return battle facts', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant({ name: 'Hero' });
      const allies = [global.testUtils.createMockParticipant({ name: 'Hero' })];
      const enemies = [global.testUtils.createMockParticipant({ name: 'Goblin', isEnemy: true })];

      // Act
      const result = rulesEngineDomainService.getBattleFacts(actor, allies, enemies);

      // Assert
      expect(result.actor.id).toBe(actor.id);
      expect(result.actor.name).toBe('Hero');
      expect(result.allyCount).toBe(1);
      expect(result.enemyCount).toBe(1);
      expect(result.always).toBe(true);
    });

    it('should handle facts creation errors', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant();
      const allies = [global.testUtils.createMockParticipant()];
      const enemies = [global.testUtils.createMockParticipant({ isEnemy: true })];

      // Create an invalid actor that will cause validation to fail
      const invalidActor = {
        ...actor,
        currentStats: null // This should cause validation to fail
      } as any;

      // Act & Assert
      expect(() => rulesEngineDomainService.getBattleFacts(invalidActor, allies, enemies)).toThrow();
    });
  });
});