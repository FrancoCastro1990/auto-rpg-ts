import { ActionResolverDomainService } from '../../src/domain/services/ActionResolverDomainService';
import { ActionResolver } from '../../src/systems/ActionResolver';
import { BattleLogger } from '../../src/utils/BattleLogger';
import { ResolvedAction } from '../../src/systems/ActionResolver';

jest.mock('../../src/systems/ActionResolver');
jest.mock('../../src/utils/BattleLogger');

describe('ActionResolverDomainService', () => {
  let actionResolverDomainService: ActionResolverDomainService;
  let mockActionResolver: jest.Mocked<ActionResolver>;
  let mockLogger: jest.Mocked<BattleLogger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockActionResolver = {
      resolveAction: jest.fn(),
      validateAction: jest.fn(),
      debugActionResolution: jest.fn(),
      getAllPossibleTargets: jest.fn(),
      validateRulesConfiguration: jest.fn()
    } as any;

    mockLogger = {
      logDebug: jest.fn(),
      logError: jest.fn(),
      logWarning: jest.fn(),
      log: jest.fn()
    } as any;

    // Mock constructor
    (ActionResolver as jest.MockedClass<typeof ActionResolver>).mockImplementation(() => mockActionResolver);

    // Create service instance
    actionResolverDomainService = new ActionResolverDomainService(mockLogger);
  });

  describe('resolveAction', () => {
    it('should resolve action successfully', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [global.testUtils.createMockParticipant({ name: 'Ally1' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Enemy1' })],
        turnNumber: 1
      };

      const expectedAction: ResolvedAction = {
        rule: { priority: 5, condition: 'true', target: 'weakestEnemy', action: 'cast:fireball' },
        actionType: 'cast',
        skillId: 'fireball',
        targetName: 'Enemy1',
        priority: 5,
        success: true,
        message: 'Hero casts fireball on Enemy1'
      };

      mockActionResolver.resolveAction.mockReturnValue(expectedAction);

      // Act
      const result = actionResolverDomainService.resolveAction(request);

      // Assert
      expect(mockActionResolver.resolveAction).toHaveBeenCalledWith(
        request.actor,
        request.allies,
        request.enemies,
        request.turnNumber
      );
      expect(result.actionType).toBe('cast');
      expect(result.skillId).toBe('fireball');
      expect(result.targetName).toBe('Enemy1');
      expect(result.resolutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle action resolution errors', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [],
        enemies: []
      };

      mockActionResolver.resolveAction.mockImplementation(() => {
        throw new Error('No valid actions available');
      });

      // Act & Assert
      expect(() => actionResolverDomainService.resolveAction(request))
        .toThrow('Action resolution failed: No valid actions available');
    });

    it('should handle null resolved action', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [global.testUtils.createMockParticipant({ name: 'Ally1' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Enemy1' })]
      };

      mockActionResolver.resolveAction.mockReturnValue(null as any);

      // Act
      const result = actionResolverDomainService.resolveAction(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.resolutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateAction', () => {
    it('should validate action successfully', () => {
      // Arrange
      const request = {
        action: {
          rule: { priority: 5, condition: 'true', target: 'weakestEnemy', action: 'cast:fireball' },
          actionType: 'cast' as const,
          skillId: 'fireball',
          targetName: 'Enemy1',
          priority: 5,
          success: true,
          message: 'Hero casts fireball on Enemy1'
        },
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        availableSkills: ['fireball', 'heal', 'power_attack']
      };

      const expectedValidation = {
        valid: true,
        errors: []
      };

      mockActionResolver.validateAction.mockReturnValue(expectedValidation);

      // Act
      const result = actionResolverDomainService.validateAction(request);

      // Assert
      expect(mockActionResolver.validateAction).toHaveBeenCalledWith(
        request.action,
        request.actor,
        request.availableSkills
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle invalid action', () => {
      // Arrange
      const request = {
        action: {
          rule: { priority: 5, condition: 'true', target: 'weakestEnemy', action: 'cast:unknown_skill' },
          actionType: 'cast' as const,
          skillId: 'unknown_skill',
          targetName: 'Enemy1',
          priority: 5,
          success: true,
          message: 'Hero attempts to cast unknown_skill'
        },
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        availableSkills: ['fireball', 'heal']
      };

      const expectedValidation = {
        valid: false,
        errors: ['Skill not available', 'Invalid target']
      };

      mockActionResolver.validateAction.mockReturnValue(expectedValidation);

      // Act
      const result = actionResolverDomainService.validateAction(request);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Skill not available');
    });

    it('should handle validation errors', () => {
      // Arrange
      const request = {
        action: {
          rule: { priority: 5, condition: 'true', target: 'weakestEnemy', action: 'cast:fireball' },
          actionType: 'cast' as const,
          skillId: 'fireball',
          targetName: 'Enemy1',
          priority: 5,
          success: true,
          message: 'Hero casts fireball on Enemy1'
        },
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        availableSkills: ['fireball']
      };

      mockActionResolver.validateAction.mockImplementation(() => {
        throw new Error('Validation system error');
      });

      // Act
      const result = actionResolverDomainService.validateAction(request);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Validation system error']);
    });
  });

  describe('debugActionResolution', () => {
    it('should debug action resolution successfully', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [global.testUtils.createMockParticipant({ name: 'Ally1' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Enemy1' })],
        turnNumber: 1
      };

      const expectedDebugInfo = {
        context: {
          turnNumber: 1,
          alliesAlive: 1,
          enemiesAlive: 1,
          actor: request.actor,
          allies: request.allies,
          enemies: request.enemies,
          livingAllies: request.allies,
          livingEnemies: request.enemies
        },
        ruleEvaluations: [
          { rule: { priority: 1, condition: 'hp < 50', target: 'self', action: 'heal' }, evaluation: false },
          { rule: { priority: 2, condition: 'true', target: 'weakestEnemy', action: 'attack' }, evaluation: true }
        ],
        selectedRule: { priority: 2, condition: 'true', target: 'weakestEnemy', action: 'attack' },
        resolvedAction: {
          rule: { priority: 2, condition: 'true', target: 'weakestEnemy', action: 'attack' },
          actionType: 'attack' as const,
          targetName: 'Enemy1',
          priority: 2,
          success: true,
          message: 'Hero attacks Enemy1'
        }
      };

      mockActionResolver.debugActionResolution.mockReturnValue(expectedDebugInfo);

      // Act
      const result = actionResolverDomainService.debugActionResolution(request);

      // Assert
      expect(mockActionResolver.debugActionResolution).toHaveBeenCalledWith(
        request.actor,
        request.allies,
        request.enemies,
        request.turnNumber
      );
      expect(result.context).toEqual(expectedDebugInfo.context);
      expect(result.ruleEvaluations).toEqual(expectedDebugInfo.ruleEvaluations);
      expect(result.selectedRule).toEqual(expectedDebugInfo.selectedRule);
      expect(result.resolvedAction).toEqual(expectedDebugInfo.resolvedAction);
      expect(result.debugTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle debug errors', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [],
        enemies: []
      };

      mockActionResolver.debugActionResolution.mockImplementation(() => {
        throw new Error('Debug system error');
      });

      // Act & Assert
      expect(() => actionResolverDomainService.debugActionResolution(request))
        .toThrow('Action resolution debug failed: Debug system error');
    });
  });

  describe('getAllPossibleTargets', () => {
    it('should get all possible targets successfully', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [global.testUtils.createMockParticipant({ name: 'Ally1' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Enemy1' })]
      };

      const expectedTargets = {
        self: request.actor,
        weakestEnemy: request.enemies[0],
        randomAlly: request.allies[0],
        bossEnemy: null
      };

      mockActionResolver.getAllPossibleTargets.mockReturnValue(expectedTargets);

      // Act
      const result = actionResolverDomainService.getAllPossibleTargets(request);

      // Assert
      expect(mockActionResolver.getAllPossibleTargets).toHaveBeenCalledWith(
        request.actor,
        request.allies,
        request.enemies
      );
      expect(result.targets).toEqual(expectedTargets);
      expect(result.retrievalTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle targets retrieval errors', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [],
        enemies: []
      };

      mockActionResolver.getAllPossibleTargets.mockImplementation(() => {
        throw new Error('No participants available');
      });

      // Act & Assert
      expect(() => actionResolverDomainService.getAllPossibleTargets(request))
        .toThrow('All possible targets retrieval failed: No participants available');
    });
  });

  describe('validateRulesConfiguration', () => {
    it('should validate rules configuration successfully', () => {
      // Arrange
      const request = {
        rules: [
          { priority: 1, condition: 'hp < 50', target: 'self', action: 'heal' },
          { priority: 2, condition: 'true', target: 'weakestEnemy', action: 'attack' }
        ]
      };

      const expectedValidation = {
        valid: true,
        errors: [],
        warnings: []
      };

      mockActionResolver.validateRulesConfiguration.mockReturnValue(expectedValidation);

      // Act
      const result = actionResolverDomainService.validateRulesConfiguration(request);

      // Assert
      expect(mockActionResolver.validateRulesConfiguration).toHaveBeenCalledWith(request.rules);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should handle invalid rules configuration', () => {
      // Arrange
      const request = {
        rules: [
          { priority: 1, condition: 'invalid_condition', target: 'self', action: 'heal' },
          { priority: 2, condition: 'true', target: 'invalid_target', action: 'attack' }
        ]
      };

      const expectedValidation = {
        valid: false,
        errors: [
          { rule: request.rules[0]!, error: 'Invalid condition syntax' },
          { rule: request.rules[1]!, error: 'Invalid target type' }
        ],
        warnings: [
          { rule: request.rules[0]!, warning: 'Low priority rule' }
        ]
      };

      mockActionResolver.validateRulesConfiguration.mockReturnValue(expectedValidation);

      // Act
      const result = actionResolverDomainService.validateRulesConfiguration(request);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle validation errors', () => {
      // Arrange
      const request = {
        rules: [
          { priority: 1, condition: 'hp < 50', target: 'self', action: 'heal' }
        ]
      };

      mockActionResolver.validateRulesConfiguration.mockImplementation(() => {
        throw new Error('Validation system error');
      });

      // Act
      const result = actionResolverDomainService.validateRulesConfiguration(request);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.error).toBe('Validation system error');
    });
  });

  describe('analyzeActionPatterns', () => {
    it('should analyze action patterns successfully', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant({
        name: 'Hero',
        rules: [
          { priority: 1, condition: 'hp < 50', target: 'self', action: 'heal' },
          { priority: 2, condition: 'true', target: 'weakestEnemy', action: 'attack' }
        ]
      });
      const allies = [global.testUtils.createMockParticipant({ name: 'Ally1' })];
      const enemies = [global.testUtils.createMockParticipant({ name: 'Enemy1' })];

      const mockResolvedAction: ResolvedAction = {
        rule: { priority: 2, condition: 'true', target: 'weakestEnemy', action: 'attack' },
        actionType: 'attack',
        skillId: undefined,
        targetName: 'Enemy1',
        priority: 2,
        success: true,
        message: 'Hero attacks Enemy1'
      };

      mockActionResolver.resolveAction
        .mockReturnValueOnce(mockResolvedAction)
        .mockReturnValueOnce(mockResolvedAction)
        .mockReturnValueOnce(mockResolvedAction);

      // Act
      const result = actionResolverDomainService.analyzeActionPatterns(actor, allies, enemies, 3);

      // Assert
      expect(mockActionResolver.resolveAction).toHaveBeenCalledTimes(3);
      expect(result.commonActions).toHaveLength(1);
      expect(result.commonActions[0]?.action).toBe('attack');
      expect(result.commonActions[0]?.count).toBe(3);
      expect(result.commonActions[0]?.percentage).toBe(100);
      expect(result.commonTargets).toHaveLength(1);
      expect(result.commonTargets[0]?.target).toBe('Enemy1');
      expect(result.averageResolutionTime).toBeGreaterThanOrEqual(0);
      expect(result.analysisTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle analysis with skill actions', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant({ name: 'Mage' });
      const allies = [global.testUtils.createMockParticipant({ name: 'Ally1' })];
      const enemies = [global.testUtils.createMockParticipant({ name: 'Enemy1' })];

      const mockResolvedAction: ResolvedAction = {
        rule: { priority: 1, condition: 'true', target: 'weakestEnemy', action: 'cast:fireball' },
        actionType: 'cast',
        skillId: 'fireball',
        targetName: 'Enemy1',
        priority: 1,
        success: true,
        message: 'Mage casts fireball on Enemy1'
      };

      mockActionResolver.resolveAction.mockReturnValue(mockResolvedAction);

      // Act
      const result = actionResolverDomainService.analyzeActionPatterns(actor, allies, enemies, 2);

      // Assert
      expect(result.commonActions[0]?.action).toBe('cast:fireball');
      expect(result.commonActions[0]?.count).toBe(2);
      expect(result.commonActions[0]?.percentage).toBe(100);
    });

    it('should handle analysis errors', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant({ name: 'Hero' });
      const allies = [global.testUtils.createMockParticipant({ name: 'Ally1' })];
      const enemies = [global.testUtils.createMockParticipant({ name: 'Enemy1' })];

      mockActionResolver.resolveAction.mockImplementation(() => {
        throw new Error('Resolution error');
      });

      // Act & Assert
      expect(() => actionResolverDomainService.analyzeActionPatterns(actor, allies, enemies, 1))
        .toThrow('Action patterns analysis failed: Resolution error');
    });
  });

  describe('getActionResolver', () => {
    it('should return the underlying ActionResolver instance', () => {
      // Act
      const result = actionResolverDomainService.getActionResolver();

      // Assert
      expect(result).toBe(mockActionResolver);
    });
  });
});