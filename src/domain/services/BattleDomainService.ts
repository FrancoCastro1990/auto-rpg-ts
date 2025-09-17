// Domain Service: Battle Service - Encapsulates battle logic for Clean Architecture
import { BattleSystem, BattleState, TurnResult } from '../../systems/index';
import { BattleResult } from '../../models/types';
import { EntityFactory } from '../../loaders/EntityFactory';
import { BattleLogger } from '../../utils/BattleLogger';
import { Character, EnemyInstance } from '../../models/types';

export interface BattleExecutionRequest {
  allies: Character[];
  enemies: EnemyInstance[];
  maxTurns?: number;
}

export interface BattleExecutionResponse {
  success: boolean;
  battleResult?: BattleResult;
  error?: string;
}

export interface TurnExecutionResponse {
  success: boolean;
  turnResult?: TurnResult;
  error?: string;
}

export class BattleDomainService {
  private battleSystem: BattleSystem;

  constructor(
    private entityFactory: EntityFactory,
    private logger?: BattleLogger
  ) {
    this.battleSystem = new BattleSystem(logger, entityFactory);
  }

  async executeFullBattle(request: BattleExecutionRequest): Promise<BattleExecutionResponse> {
    try {
      // Initialize battle
      const battleState = this.battleSystem.initializeBattle(request.allies, request.enemies);

      if (!battleState) {
        return {
          success: false,
          error: 'Failed to initialize battle'
        };
      }

      // Execute battle
      const battleResult = this.battleSystem.simulateFullBattle(request.maxTurns || 100);

      return {
        success: true,
        battleResult
      };
    } catch (error) {
      console.error('Error executing full battle:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown battle execution error'
      };
    }
  }

  async executeTurn(): Promise<TurnExecutionResponse> {
    try {
      const turnResult = this.battleSystem.executeTurn();

      if (!turnResult) {
        return {
          success: false,
          error: 'No turn could be executed'
        };
      }

      return {
        success: true,
        turnResult
      };
    } catch (error) {
      console.error('Error executing turn:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown turn execution error'
      };
    }
  }

  getBattleState(): BattleState | null {
    return this.battleSystem.getBattleState();
  }

  getTurnHistory(): TurnResult[] {
    return this.battleSystem.getTurnHistory();
  }

  isBattleComplete(): boolean {
    return this.battleSystem.isBattleComplete();
  }

  getBattleResult(): BattleResult | null {
    return this.battleSystem.getBattleResult();
  }

  getParticipantStatus() {
    return this.battleSystem.getParticipantStatus();
  }

  getCurrentTurn(): number {
    return this.battleSystem.getCurrentTurn();
  }

  getTurnOrder() {
    return this.battleSystem.getTurnOrder();
  }
}