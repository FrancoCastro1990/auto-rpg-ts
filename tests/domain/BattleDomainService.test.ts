import { BattleDomainService } from '../../src/domain/services/BattleDomainService';
import { BattleSystem } from '../../src/systems/BattleSystem';
import { EntityFactory } from '../../src/loaders/EntityFactory';
import { BattleLogger } from '../../src/utils/BattleLogger';

jest.mock('../../src/systems/BattleSystem');
jest.mock('../../src/loaders/EntityFactory');
jest.mock('../../src/utils/BattleLogger');

describe('BattleDomainService', () => {
  let battleDomainService: BattleDomainService;
  let mockBattleSystem: jest.Mocked<BattleSystem>;
  let mockEntityFactory: jest.Mocked<EntityFactory>;
  let mockLogger: jest.Mocked<BattleLogger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockBattleSystem = {
      initializeBattle: jest.fn(),
      simulateFullBattle: jest.fn(),
      executeTurn: jest.fn(),
      getBattleState: jest.fn(),
      getTurnHistory: jest.fn(),
      isBattleComplete: jest.fn(),
      getBattleResult: jest.fn(),
      getParticipantStatus: jest.fn(),
      getCurrentTurn: jest.fn(),
      getTurnOrder: jest.fn()
    } as any;

    mockEntityFactory = {} as any;
    mockLogger = {} as any;

    // Mock constructors
    (BattleSystem as jest.MockedClass<typeof BattleSystem>).mockImplementation(() => mockBattleSystem);
    (EntityFactory as jest.MockedClass<typeof EntityFactory>).mockImplementation(() => mockEntityFactory);

    // Create service instance
    battleDomainService = new BattleDomainService(mockEntityFactory, mockLogger);
  });

  describe('executeFullBattle', () => {
    it('should execute full battle successfully', async () => {
      // Arrange
      const request = {
        allies: [global.testUtils.createMockParticipant({ name: 'Hero' })],
        enemies: [global.testUtils.createMockParticipant({ name: 'Goblin', isEnemy: true })],
        maxTurns: 50
      };

      const mockBattleState = { allies: request.allies, enemies: request.enemies };
      const expectedResult = {
        victory: true,
        turns: 5,
        reason: 'All enemies defeated',
        survivingAllies: request.allies,
        defeatedEnemies: request.enemies,
        battleLog: ['Battle started', 'Hero attacks Goblin', 'Goblin defeated']
      };

      mockBattleSystem.initializeBattle.mockReturnValue(mockBattleState as any);
      mockBattleSystem.simulateFullBattle.mockReturnValue(expectedResult);

      // Act
      const result = await battleDomainService.executeFullBattle(request);

      // Assert
      expect(mockBattleSystem.initializeBattle).toHaveBeenCalledWith(
        request.allies,
        request.enemies
      );
      expect(mockBattleSystem.simulateFullBattle).toHaveBeenCalledWith(50);
      expect(result.success).toBe(true);
      expect(result.battleResult).toEqual(expectedResult);
    });

    it('should handle battle initialization failure', async () => {
      // Arrange
      const request = {
        allies: [global.testUtils.createMockParticipant()],
        enemies: [global.testUtils.createMockParticipant({ isEnemy: true })]
      };

      mockBattleSystem.initializeBattle.mockReturnValue(null as any);

      // Act
      const result = await battleDomainService.executeFullBattle(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to initialize battle');
      expect(result.battleResult).toBeUndefined();
    });

    it('should use default maxTurns when not provided', async () => {
      // Arrange
      const request = {
        allies: [global.testUtils.createMockParticipant()],
        enemies: [global.testUtils.createMockParticipant({ isEnemy: true })]
      };

      const mockBattleState = { allies: request.allies, enemies: request.enemies };
      const expectedResult = {
        victory: true,
        turns: 1,
        reason: 'Quick victory',
        survivingAllies: request.allies,
        defeatedEnemies: request.enemies,
        battleLog: ['Quick battle']
      };

      mockBattleSystem.initializeBattle.mockReturnValue(mockBattleState as any);
      mockBattleSystem.simulateFullBattle.mockReturnValue(expectedResult);

      // Act
      const result = await battleDomainService.executeFullBattle(request);

      // Assert
      expect(mockBattleSystem.simulateFullBattle).toHaveBeenCalledWith(100);
    });
  });

  describe('executeTurn', () => {
    it('should execute turn successfully', async () => {
      // Arrange
      const expectedTurnResult = {
        turnNumber: 1,
        actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
        action: { actionType: 'attack' as const },
        target: global.testUtils.createMockParticipant({ name: 'Goblin', isEnemy: true }),
        damage: 25,
        success: true,
        message: 'Hero attacks Goblin for 25 damage'
      };

      mockBattleSystem.executeTurn.mockReturnValue(expectedTurnResult as any);

      // Act
      const result = await battleDomainService.executeTurn();

      // Assert
      expect(mockBattleSystem.executeTurn).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.turnResult).toEqual(expectedTurnResult);
    });

    it('should handle turn execution failure', async () => {
      // Arrange
      mockBattleSystem.executeTurn.mockReturnValue(null as any);

      // Act
      const result = await battleDomainService.executeTurn();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No turn could be executed');
      expect(result.turnResult).toBeUndefined();
    });
  });

  describe('getBattleState', () => {
    it('should return current battle state', () => {
      // Arrange
      const expectedState = {
        allies: [global.testUtils.createMockParticipant()],
        enemies: [global.testUtils.createMockParticipant({ isEnemy: true })],
        turnNumber: 3,
        isComplete: false
      };

      mockBattleSystem.getBattleState.mockReturnValue(expectedState as any);

      // Act
      const result = battleDomainService.getBattleState();

      // Assert
      expect(result).toEqual(expectedState);
      expect(mockBattleSystem.getBattleState).toHaveBeenCalled();
    });

    it('should return null when no battle state exists', () => {
      // Arrange
      mockBattleSystem.getBattleState.mockReturnValue(null);

      // Act
      const result = battleDomainService.getBattleState();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getTurnHistory', () => {
    it('should return turn history', () => {
      // Arrange
      const expectedHistory = [
        {
          turnNumber: 1,
          actor: global.testUtils.createMockParticipant({ name: 'Hero' }),
          action: { actionType: 'attack' as const },
          target: global.testUtils.createMockParticipant({ name: 'Goblin', isEnemy: true }),
          damage: 25,
          success: true,
          message: 'Hero attacks Goblin'
        }
      ];

      mockBattleSystem.getTurnHistory.mockReturnValue(expectedHistory as any);

      // Act
      const result = battleDomainService.getTurnHistory();

      // Assert
      expect(result).toEqual(expectedHistory);
      expect(mockBattleSystem.getTurnHistory).toHaveBeenCalled();
    });
  });

  describe('isBattleComplete', () => {
    it('should return true when battle is complete', () => {
      // Arrange
      mockBattleSystem.isBattleComplete.mockReturnValue(true);

      // Act
      const result = battleDomainService.isBattleComplete();

      // Assert
      expect(result).toBe(true);
      expect(mockBattleSystem.isBattleComplete).toHaveBeenCalled();
    });

    it('should return false when battle is not complete', () => {
      // Arrange
      mockBattleSystem.isBattleComplete.mockReturnValue(false);

      // Act
      const result = battleDomainService.isBattleComplete();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getBattleResult', () => {
    it('should return battle result when available', () => {
      // Arrange
      const expectedResult = {
        victory: true,
        turns: 5,
        reason: 'All enemies defeated',
        survivingAllies: [global.testUtils.createMockParticipant()],
        defeatedEnemies: [global.testUtils.createMockParticipant({ isEnemy: true })],
        battleLog: ['Battle completed successfully']
      };

      mockBattleSystem.getBattleResult.mockReturnValue(expectedResult);

      // Act
      const result = battleDomainService.getBattleResult();

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockBattleSystem.getBattleResult).toHaveBeenCalled();
    });

    it('should return null when no battle result exists', () => {
      // Arrange
      mockBattleSystem.getBattleResult.mockReturnValue(null);

      // Act
      const result = battleDomainService.getBattleResult();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getParticipantStatus', () => {
    it('should return participant status', () => {
      // Arrange
      const expectedStatus = [
        {
          participant: global.testUtils.createMockParticipant({ name: 'Hero' }),
          hpPercent: 100,
          mpPercent: 50,
          buffs: 0,
          activeCooldowns: 0
        },
        {
          participant: global.testUtils.createMockParticipant({ name: 'Goblin', isEnemy: true }),
          hpPercent: 0,
          mpPercent: 30,
          buffs: 1,
          activeCooldowns: 2
        }
      ];

      mockBattleSystem.getParticipantStatus.mockReturnValue(expectedStatus as any);

      // Act
      const result = battleDomainService.getParticipantStatus();

      // Assert
      expect(result).toEqual(expectedStatus);
      expect(mockBattleSystem.getParticipantStatus).toHaveBeenCalled();
    });
  });

  describe('getCurrentTurn', () => {
    it('should return current turn number', () => {
      // Arrange
      mockBattleSystem.getCurrentTurn.mockReturnValue(5);

      // Act
      const result = battleDomainService.getCurrentTurn();

      // Assert
      expect(result).toBe(5);
      expect(mockBattleSystem.getCurrentTurn).toHaveBeenCalled();
    });
  });

  describe('getTurnOrder', () => {
    it('should return turn order', () => {
      // Arrange
      const expectedTurnOrder = [
        {
          participant: global.testUtils.createMockParticipant({ name: 'Hero' }),
          speed: 10,
          initiative: 15
        },
        {
          participant: global.testUtils.createMockParticipant({ name: 'Goblin', isEnemy: true }),
          speed: 8,
          initiative: 12
        }
      ];

      mockBattleSystem.getTurnOrder.mockReturnValue(expectedTurnOrder as any);

      // Act
      const result = battleDomainService.getTurnOrder();

      // Assert
      expect(result).toEqual(expectedTurnOrder);
      expect(mockBattleSystem.getTurnOrder).toHaveBeenCalled();
    });
  });
});