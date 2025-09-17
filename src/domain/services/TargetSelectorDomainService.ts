import { TargetSelector, TargetType, TargetSelectionResult } from '../../systems/TargetSelector';
import { BattleParticipant } from '../../models/types';
import { ValidationError } from '../../utils/errors';
import { BattleLogger } from '../../utils/BattleLogger';

export interface TargetSelectionRequest {
  targetType: TargetType;
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
}

export interface TargetSelectionResponse extends TargetSelectionResult {
  selectionTime: number;
}

export interface AllTargetsRequest {
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
}

export interface AllTargetsResponse {
  targets: Record<TargetType, TargetSelectionResult>;
  selectionTime: number;
}

export interface TargetValidationRequest {
  targetType: string;
}

export interface TargetValidationResponse {
  valid: boolean;
  targetType?: TargetType;
  error?: string;
}

export interface TargetDescriptionRequest {
  targetType: TargetType;
}

export interface TargetDescriptionResponse {
  description: string;
}

export interface OptimalTargetRequest {
  action: 'attack' | 'heal' | 'buff' | 'debuff';
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
}

export interface OptimalTargetResponse extends TargetSelectionResult {
  selectionTime: number;
}

export class TargetSelectorDomainService {
  private logger: BattleLogger;

  constructor(logger?: BattleLogger) {
    this.logger = logger || new BattleLogger();
  }

  /**
   * Select a target based on target type
   */
  selectTarget(request: TargetSelectionRequest): TargetSelectionResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('TargetSelectorDomainService', 'Selecting target', {
        targetType: request.targetType,
        actorId: request.actor.id,
        actorName: request.actor.name,
        allyCount: request.allies.length,
        enemyCount: request.enemies.length
      });

      const result = TargetSelector.selectTarget(
        request.targetType,
        request.actor,
        request.allies,
        request.enemies
      );

      const selectionTime = Date.now() - startTime;

      this.logger.logDebug('TargetSelectorDomainService', 'Target selection completed', {
        targetType: request.targetType,
        targetSelected: result.target !== null,
        targetName: result.target?.name,
        alternativesCount: result.alternatives.length,
        selectionTimeMs: selectionTime
      });

      return {
        ...result,
        selectionTime
      };

    } catch (error) {
      const selectionTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('TargetSelectorDomainService', 'Target selection failed', {
        targetType: request.targetType,
        error: err.message,
        selectionTimeMs: selectionTime
      });

      throw new ValidationError(`Target selection failed: ${err.message}`);
    }
  }

  /**
   * Get all possible targets for analysis
   */
  getAllTargets(request: AllTargetsRequest): AllTargetsResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('TargetSelectorDomainService', 'Getting all targets', {
        actorId: request.actor.id,
        actorName: request.actor.name,
        allyCount: request.allies.length,
        enemyCount: request.enemies.length
      });

      const targets = TargetSelector.getAllValidTargets(
        request.actor,
        request.allies,
        request.enemies
      );

      const selectionTime = Date.now() - startTime;

      // Count successful selections
      const successfulSelections = Object.values(targets).filter(t => t.target !== null).length;

      this.logger.logDebug('TargetSelectorDomainService', 'All targets retrieved', {
        totalTargets: Object.keys(targets).length,
        successfulSelections,
        selectionTimeMs: selectionTime
      });

      return {
        targets,
        selectionTime
      };

    } catch (error) {
      const selectionTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('TargetSelectorDomainService', 'All targets retrieval failed', {
        error: err.message,
        selectionTimeMs: selectionTime
      });

      throw new ValidationError(`All targets retrieval failed: ${err.message}`);
    }
  }

  /**
   * Validate a target type string
   */
  validateTargetType(request: TargetValidationRequest): TargetValidationResponse {
    try {
      const isValid = TargetSelector.validateTargetType(request.targetType);

      this.logger.logDebug('TargetSelectorDomainService', 'Target type validation completed', {
        targetType: request.targetType,
        valid: isValid
      });

      if (isValid) {
        return {
          valid: true,
          targetType: request.targetType as TargetType
        };
      } else {
        return {
          valid: false,
          error: `Invalid target type: ${request.targetType}`
        };
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('TargetSelectorDomainService', 'Target type validation failed', {
        targetType: request.targetType,
        error: err.message
      });

      return {
        valid: false,
        error: err.message
      };
    }
  }

  /**
   * Get description for a target type
   */
  getTargetDescription(request: TargetDescriptionRequest): TargetDescriptionResponse {
    try {
      const description = TargetSelector.getTargetDescription(request.targetType);

      this.logger.logDebug('TargetSelectorDomainService', 'Target description retrieved', {
        targetType: request.targetType,
        description
      });

      return {
        description
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('TargetSelectorDomainService', 'Target description retrieval failed', {
        targetType: request.targetType,
        error: err.message
      });

      return {
        description: 'Unknown target type'
      };
    }
  }

  /**
   * Suggest optimal target based on action type
   */
  suggestOptimalTarget(request: OptimalTargetRequest): OptimalTargetResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('TargetSelectorDomainService', 'Suggesting optimal target', {
        action: request.action,
        actorId: request.actor.id,
        actorName: request.actor.name,
        allyCount: request.allies.length,
        enemyCount: request.enemies.length
      });

      const result = TargetSelector.suggestOptimalTarget(
        request.action,
        request.actor,
        request.allies,
        request.enemies
      );

      const selectionTime = Date.now() - startTime;

      this.logger.logDebug('TargetSelectorDomainService', 'Optimal target suggested', {
        action: request.action,
        targetSelected: result.target !== null,
        targetName: result.target?.name,
        selectionTimeMs: selectionTime
      });

      return {
        ...result,
        selectionTime
      };

    } catch (error) {
      const selectionTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('TargetSelectorDomainService', 'Optimal target suggestion failed', {
        action: request.action,
        error: err.message,
        selectionTimeMs: selectionTime
      });

      throw new ValidationError(`Optimal target suggestion failed: ${err.message}`);
    }
  }

  /**
   * Get available target types
   */
  getAvailableTargetTypes(): TargetType[] {
    return [
      'self', 'weakestEnemy', 'lowestHpEnemy', 'strongestEnemy', 'randomEnemy',
      'bossEnemy', 'lowestHpAlly', 'randomAlly', 'strongestAlly', 'highestMpAlly'
    ];
  }

  /**
   * Analyze target selection patterns
   */
  analyzeTargetPatterns(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): {
    livingAllies: number;
    livingEnemies: number;
    hasBoss: boolean;
    lowestHpAllyPercentage: number;
    highestHpEnemy: number;
    analysisTime: number;
  } {
    const startTime = Date.now();

    try {
      const livingAllies = allies.filter(a => a.isAlive);
      const livingEnemies = enemies.filter(e => e.isAlive);
      const hasBoss = livingEnemies.some(e => e.isBoss);

      const lowestHpAllyPercentage = livingAllies.length > 0
        ? Math.min(...livingAllies.map(a => (a.currentStats.hp / a.maxStats.hp) * 100))
        : 100;

      const highestHpEnemy = livingEnemies.length > 0
        ? Math.max(...livingEnemies.map(e => e.currentStats.hp))
        : 0;

      const analysisTime = Date.now() - startTime;

      this.logger.logDebug('TargetSelectorDomainService', 'Target patterns analyzed', {
        livingAllies: livingAllies.length,
        livingEnemies: livingEnemies.length,
        hasBoss,
        lowestHpAllyPercentage,
        highestHpEnemy,
        analysisTimeMs: analysisTime
      });

      return {
        livingAllies: livingAllies.length,
        livingEnemies: livingEnemies.length,
        hasBoss,
        lowestHpAllyPercentage,
        highestHpEnemy,
        analysisTime
      };

    } catch (error) {
      const analysisTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('TargetSelectorDomainService', 'Target pattern analysis failed', {
        error: err.message,
        analysisTimeMs: analysisTime
      });

      throw new ValidationError(`Target pattern analysis failed: ${err.message}`);
    }
  }
}