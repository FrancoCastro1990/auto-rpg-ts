import { TargetSelectorDomainService } from '../../src/domain/services/TargetSelectorDomainService';
import { TargetSelector } from '../../src/systems/TargetSelector';
import { BattleLogger } from '../../src/utils/BattleLogger';
import { TargetType } from '../../src/systems/TargetSelector';

jest.mock('../../src/systems/TargetSelector');
jest.mock('../../src/utils/BattleLogger');

describe('TargetSelectorDomainService', () => {
  let targetSelectorDomainService: TargetSelectorDomainService;
  let mockTargetSelector: jest.Mocked<typeof TargetSelector>;
  let mockLogger: jest.Mocked<BattleLogger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockTargetSelector = {
      selectTarget: jest.fn(),
      getAllValidTargets: jest.fn(),
      validateTargetType: jest.fn(),
      getTargetDescription: jest.fn(),
      suggestOptimalTarget: jest.fn()
    } as any;

    mockLogger = {
      logDebug: jest.fn(),
      logError: jest.fn(),
      logWarning: jest.fn(),
      log: jest.fn()
    } as any;

    // Mock static methods
    (TargetSelector as any).selectTarget = mockTargetSelector.selectTarget;
    (TargetSelector as any).getAllValidTargets = mockTargetSelector.getAllValidTargets;
    (TargetSelector as any).validateTargetType = mockTargetSelector.validateTargetType;
    (TargetSelector as any).getTargetDescription = mockTargetSelector.getTargetDescription;
    (TargetSelector as any).suggestOptimalTarget = mockTargetSelector.suggestOptimalTarget;

    // Create service instance
    targetSelectorDomainService = new TargetSelectorDomainService(mockLogger);
  });

  describe('selectTarget', () => {
    it('should select target successfully', () => {
      // Arrange
      const request = {
        targetType: 'weakestEnemy' as TargetType,
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [global.testUtils.createMockParticipant({ name: 'Ally1' })],
        enemies: [
          global.testUtils.createMockParticipant({ name: 'Enemy1', currentStats: { hp: 50 } }),
          global.testUtils.createMockParticipant({ name: 'Enemy2', currentStats: { hp: 30 } })
        ]
      };

      const expectedResult = {
        target: request.enemies[1], // weakest enemy
        reason: 'Selected weakest enemy',
        alternatives: [request.enemies[0]]
      };

      mockTargetSelector.selectTarget.mockReturnValue(expectedResult);

      // Act
      const result = targetSelectorDomainService.selectTarget(request);

      // Assert
      expect(mockTargetSelector.selectTarget).toHaveBeenCalledWith(
        request.targetType,
        request.actor,
        request.allies,
        request.enemies
      );
      expect(result.target).toEqual(expectedResult.target);
      expect(result.alternatives).toEqual(expectedResult.alternatives);
      expect(result.selectionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle target selection errors', () => {
      // Arrange
      const request = {
        targetType: 'weakestEnemy' as TargetType,
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [],
        enemies: []
      };

      mockTargetSelector.selectTarget.mockImplementation(() => {
        throw new Error('No valid targets found');
      });

      // Act & Assert
      expect(() => targetSelectorDomainService.selectTarget(request))
        .toThrow('Target selection failed: No valid targets found');
    });

    it('should select self target', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant({ name: 'Hero' });
      const request = {
        targetType: 'self' as TargetType,
        actor,
        allies: [global.testUtils.createMockParticipant({ name: 'Ally1' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Enemy1' })]
      };

      const expectedResult = {
        target: actor,
        reason: 'Targeting self',
        alternatives: []
      };

      mockTargetSelector.selectTarget.mockReturnValue(expectedResult);

      // Act
      const result = targetSelectorDomainService.selectTarget(request);

      // Assert
      expect(result.target).toEqual(actor);
      expect(result.alternatives).toEqual([]);
    });
  });

  describe('getAllTargets', () => {
    it('should get all targets successfully', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [global.testUtils.createMockParticipant({ name: 'Ally1' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Enemy1' })]
      };

      const expectedTargets = {
        weakestEnemy: { target: request.enemies[0], reason: 'Selected weakest enemy', alternatives: [] },
        self: { target: request.actor, reason: 'Targeting self', alternatives: [] },
        randomAlly: { target: request.allies[0], reason: 'Selected random ally', alternatives: [] },
        lowestHpEnemy: { target: request.enemies[0], reason: 'Selected lowest HP enemy', alternatives: [] },
        strongestEnemy: { target: request.enemies[0], reason: 'Selected strongest enemy', alternatives: [] },
        randomEnemy: { target: request.enemies[0], reason: 'Selected random enemy', alternatives: [] },
        bossEnemy: { target: null, reason: 'No boss enemy found', alternatives: [] },
        lowestHpAlly: { target: request.allies[0], reason: 'Selected lowest HP ally', alternatives: [] },
        strongestAlly: { target: request.allies[0], reason: 'Selected strongest ally', alternatives: [] },
        highestMpAlly: { target: request.allies[0], reason: 'Selected highest MP ally', alternatives: [] }
      };

      mockTargetSelector.getAllValidTargets.mockReturnValue(expectedTargets);

      // Act
      const result = targetSelectorDomainService.getAllTargets(request);

      // Assert
      expect(mockTargetSelector.getAllValidTargets).toHaveBeenCalledWith(
        request.actor,
        request.allies,
        request.enemies
      );
      expect(result.targets).toEqual(expectedTargets);
      expect(result.selectionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle all targets retrieval errors', () => {
      // Arrange
      const request = {
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [],
        enemies: []
      };

      mockTargetSelector.getAllValidTargets.mockImplementation(() => {
        throw new Error('No participants available');
      });

      // Act & Assert
      expect(() => targetSelectorDomainService.getAllTargets(request))
        .toThrow('All targets retrieval failed: No participants available');
    });
  });

  describe('validateTargetType', () => {
    it('should validate valid target type', () => {
      // Arrange
      const request = {
        targetType: 'weakestEnemy'
      };

      mockTargetSelector.validateTargetType.mockReturnValue(true);

      // Act
      const result = targetSelectorDomainService.validateTargetType(request);

      // Assert
      expect(mockTargetSelector.validateTargetType).toHaveBeenCalledWith('weakestEnemy');
      expect(result.valid).toBe(true);
      expect(result.targetType).toBe('weakestEnemy');
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid target type', () => {
      // Arrange
      const request = {
        targetType: 'invalid_target'
      };

      mockTargetSelector.validateTargetType.mockReturnValue(false);

      // Act
      const result = targetSelectorDomainService.validateTargetType(request);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.targetType).toBeUndefined();
      expect(result.error).toBe('Invalid target type: invalid_target');
    });

    it('should handle validation errors', () => {
      // Arrange
      const request = {
        targetType: 'weakestEnemy'
      };

      mockTargetSelector.validateTargetType.mockImplementation(() => {
        throw new Error('Validation system error');
      });

      // Act
      const result = targetSelectorDomainService.validateTargetType(request);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Validation system error');
    });
  });

  describe('getTargetDescription', () => {
    it('should get target description successfully', () => {
      // Arrange
      const request = {
        targetType: 'weakestEnemy' as TargetType
      };

      const expectedDescription = 'Selects the enemy with the lowest HP';

      mockTargetSelector.getTargetDescription.mockReturnValue(expectedDescription);

      // Act
      const result = targetSelectorDomainService.getTargetDescription(request);

      // Assert
      expect(mockTargetSelector.getTargetDescription).toHaveBeenCalledWith('weakestEnemy');
      expect(result.description).toBe(expectedDescription);
    });

    it('should handle description retrieval errors', () => {
      // Arrange
      const request = {
        targetType: 'weakestEnemy' as TargetType
      };

      mockTargetSelector.getTargetDescription.mockImplementation(() => {
        throw new Error('Description not found');
      });

      // Act
      const result = targetSelectorDomainService.getTargetDescription(request);

      // Assert
      expect(result.description).toBe('Unknown target type');
    });
  });

  describe('suggestOptimalTarget', () => {
    it('should suggest optimal target for attack', () => {
      // Arrange
      const request = {
        action: 'attack' as const,
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [global.testUtils.createMockParticipant({ name: 'Ally1' })],
        enemies: [
          global.testUtils.createMockParticipant({ name: 'Enemy1', currentStats: { hp: 50 } }),
          global.testUtils.createMockParticipant({ name: 'Enemy2', currentStats: { hp: 30 } })
        ]
      };

      const expectedResult = {
        target: request.enemies[1], // weakest enemy for attack
        reason: 'Selected optimal target for attack',
        alternatives: [request.enemies[0]]
      };

      mockTargetSelector.suggestOptimalTarget.mockReturnValue(expectedResult);

      // Act
      const result = targetSelectorDomainService.suggestOptimalTarget(request);

      // Assert
      expect(mockTargetSelector.suggestOptimalTarget).toHaveBeenCalledWith(
        'attack',
        request.actor,
        request.allies,
        request.enemies
      );
      expect(result.target).toEqual(expectedResult.target);
      expect(result.alternatives).toEqual(expectedResult.alternatives);
      expect(result.selectionTime).toBeGreaterThanOrEqual(0);
    });

    it('should suggest optimal target for heal', () => {
      // Arrange
      const request = {
        action: 'heal' as const,
        actor: global.testUtils.createMockParticipant({ name: 'Healer' }),
        allies: [
          global.testUtils.createMockParticipant({ name: 'Ally1', currentStats: { hp: 20 } }),
          global.testUtils.createMockParticipant({ name: 'Ally2', currentStats: { hp: 80 } })
        ],
        enemies: [global.testUtils.createMockParticipant({ name: 'Enemy1' })]
      };

      const expectedResult = {
        target: request.allies[0], // lowest HP ally for heal
        reason: 'Selected optimal target for heal',
        alternatives: [request.allies[1]]
      };

      mockTargetSelector.suggestOptimalTarget.mockReturnValue(expectedResult);

      // Act
      const result = targetSelectorDomainService.suggestOptimalTarget(request);

      // Assert
      expect(result.target).toEqual(expectedResult.target);
    });

    it('should handle optimal target suggestion errors', () => {
      // Arrange
      const request = {
        action: 'attack' as const,
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        allies: [],
        enemies: []
      };

      mockTargetSelector.suggestOptimalTarget.mockImplementation(() => {
        throw new Error('No valid targets for action');
      });

      // Act & Assert
      expect(() => targetSelectorDomainService.suggestOptimalTarget(request))
        .toThrow('Optimal target suggestion failed: No valid targets for action');
    });
  });

  describe('getAvailableTargetTypes', () => {
    it('should return all available target types', () => {
      // Act
      const result = targetSelectorDomainService.getAvailableTargetTypes();

      // Assert
      expect(result).toEqual([
        'self', 'weakestEnemy', 'lowestHpEnemy', 'strongestEnemy', 'randomEnemy',
        'bossEnemy', 'lowestHpAlly', 'randomAlly', 'strongestAlly', 'highestMpAlly'
      ]);
      expect(result).toHaveLength(10);
    });
  });

  describe('analyzeTargetPatterns', () => {
    it('should analyze target patterns successfully', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant({ name: 'Hero' });
      const allies = [
        global.testUtils.createMockParticipant({ name: 'Ally1', currentStats: { hp: 50 }, maxStats: { hp: 100 } }),
        global.testUtils.createMockParticipant({ name: 'Ally2', currentStats: { hp: 80 }, maxStats: { hp: 100 } })
      ];
      const enemies = [
        global.testUtils.createMockParticipant({ name: 'Enemy1', currentStats: { hp: 100 }, isBoss: false }),
        global.testUtils.createMockParticipant({ name: 'Boss', currentStats: { hp: 200 }, isBoss: true })
      ];

      // Act
      const result = targetSelectorDomainService.analyzeTargetPatterns(actor, allies, enemies);

      // Assert
      expect(result.livingAllies).toBe(2);
      expect(result.livingEnemies).toBe(2);
      expect(result.hasBoss).toBe(true);
      expect(result.lowestHpAllyPercentage).toBe(50); // 50/100 = 50%
      expect(result.highestHpEnemy).toBe(200);
      expect(result.analysisTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty participant lists', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant({ name: 'Hero' });
      const allies: any[] = [];
      const enemies: any[] = [];

      // Act
      const result = targetSelectorDomainService.analyzeTargetPatterns(actor, allies, enemies);

      // Assert
      expect(result.livingAllies).toBe(0);
      expect(result.livingEnemies).toBe(0);
      expect(result.hasBoss).toBe(false);
      expect(result.lowestHpAllyPercentage).toBe(100);
      expect(result.highestHpEnemy).toBe(0);
    });

    it('should handle analysis errors', () => {
      // Arrange
      const actor = global.testUtils.createMockParticipant({ name: 'Hero' });
      const allies = [global.testUtils.createMockParticipant({ name: 'Ally1' })];
      const enemies = [global.testUtils.createMockParticipant({ name: 'Enemy1' })];

      // Mock a participant with invalid stats to cause error
      allies[0].currentStats = null as any;

      // Act & Assert
      expect(() => targetSelectorDomainService.analyzeTargetPatterns(actor, allies, enemies))
        .toThrow('Target pattern analysis failed');
    });
  });
});