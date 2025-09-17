import { ActionResolver, ResolvedAction } from '../../systems/ActionResolver';
import { BattleParticipant, Rule } from '../../models/types';
import { ValidationError } from '../../utils/errors';
import { BattleLogger } from '../../utils/BattleLogger';

export interface ActionResolutionRequest {
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
  turnNumber?: number;
}

export interface ActionResolutionResponse extends ResolvedAction {
  resolutionTime: number;
}

export interface ActionValidationRequest {
  action: ResolvedAction;
  actor: BattleParticipant;
  availableSkills: string[];
}

export interface ActionValidationResponse {
  valid: boolean;
  errors: string[];
}

export interface ActionDebugRequest {
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
  turnNumber?: number;
}

export interface ActionDebugResponse {
  context: any; // ConditionContext
  ruleEvaluations: Array<{ rule: Rule; evaluation: boolean }>;
  selectedRule: Rule | null;
  resolvedAction: ResolvedAction | null;
  debugTime: number;
}

export interface ActionResolverAllTargetsRequest {
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
}

export interface ActionResolverAllTargetsResponse {
  targets: Record<string, BattleParticipant | null>;
  retrievalTime: number;
}

export interface ActionResolverRulesValidationRequest {
  rules: Rule[];
}

export interface ActionResolverRulesValidationResponse {
  valid: boolean;
  errors: Array<{ rule: Rule; error: string }>;
  warnings: Array<{ rule: Rule; warning: string }>;
}

export class ActionResolverDomainService {
  private actionResolver: ActionResolver;
  private logger: BattleLogger;

  constructor(logger?: BattleLogger) {
    this.actionResolver = new ActionResolver();
    this.logger = logger || new BattleLogger();
  }

  /**
   * Resolve action for a battle participant
   */
  resolveAction(request: ActionResolutionRequest): ActionResolutionResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('ActionResolverDomainService', 'Resolving action', {
        actorId: request.actor.id,
        actorName: request.actor.name,
        turnNumber: request.turnNumber || 1,
        allyCount: request.allies.length,
        enemyCount: request.enemies.length,
        ruleCount: request.actor.rules?.length || 0
      });

      const resolvedAction = this.actionResolver.resolveAction(
        request.actor,
        request.allies,
        request.enemies,
        request.turnNumber
      );

      const resolutionTime = Date.now() - startTime;

      if (resolvedAction) {
        this.logger.logDebug('ActionResolverDomainService', 'Action resolved successfully', {
          actionType: resolvedAction.actionType,
          skillId: resolvedAction.skillId,
          targetName: resolvedAction.targetName,
          priority: resolvedAction.priority,
          success: resolvedAction.success,
          resolutionTimeMs: resolutionTime
        });
      } else {
        this.logger.logDebug('ActionResolverDomainService', 'No action resolved', {
          resolutionTimeMs: resolutionTime
        });
      }

      return {
        ...resolvedAction!,
        resolutionTime
      };

    } catch (error) {
      const resolutionTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('ActionResolverDomainService', 'Action resolution failed', {
        actorId: request.actor.id,
        error: err.message,
        resolutionTimeMs: resolutionTime
      });

      throw new ValidationError(`Action resolution failed: ${err.message}`);
    }
  }

  /**
   * Validate a resolved action
   */
  validateAction(request: ActionValidationRequest): ActionValidationResponse {
    try {
      this.logger.logDebug('ActionResolverDomainService', 'Validating action', {
        actionType: request.action.actionType,
        skillId: request.action.skillId,
        targetName: request.action.targetName,
        actorName: request.actor.name
      });

      const validation = this.actionResolver.validateAction(
        request.action,
        request.actor,
        request.availableSkills
      );

      this.logger.logDebug('ActionResolverDomainService', 'Action validation completed', {
        valid: validation.valid,
        errorCount: validation.errors.length
      });

      return validation;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('ActionResolverDomainService', 'Action validation failed', {
        error: err.message
      });

      return {
        valid: false,
        errors: [err.message]
      };
    }
  }

  /**
   * Debug action resolution process
   */
  debugActionResolution(request: ActionDebugRequest): ActionDebugResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('ActionResolverDomainService', 'Debugging action resolution', {
        actorId: request.actor.id,
        actorName: request.actor.name,
        turnNumber: request.turnNumber || 1
      });

      const debugInfo = this.actionResolver.debugActionResolution(
        request.actor,
        request.allies,
        request.enemies,
        request.turnNumber
      );

      const debugTime = Date.now() - startTime;

      this.logger.logDebug('ActionResolverDomainService', 'Action resolution debug completed', {
        selectedRule: debugInfo.selectedRule !== null,
        resolvedAction: debugInfo.resolvedAction !== null,
        ruleEvaluationCount: debugInfo.ruleEvaluations.length,
        debugTimeMs: debugTime
      });

      return {
        ...debugInfo,
        debugTime
      };

    } catch (error) {
      const debugTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('ActionResolverDomainService', 'Action resolution debug failed', {
        error: err.message,
        debugTimeMs: debugTime
      });

      throw new ValidationError(`Action resolution debug failed: ${err.message}`);
    }
  }

  /**
   * Get all possible targets for analysis
   */
  getAllPossibleTargets(request: ActionResolverAllTargetsRequest): ActionResolverAllTargetsResponse {
    const startTime = Date.now();

    try {
      this.logger.logDebug('ActionResolverDomainService', 'Getting all possible targets', {
        actorId: request.actor.id,
        actorName: request.actor.name,
        allyCount: request.allies.length,
        enemyCount: request.enemies.length
      });

      const targets = this.actionResolver.getAllPossibleTargets(
        request.actor,
        request.allies,
        request.enemies
      );

      const retrievalTime = Date.now() - startTime;

      // Count non-null targets
      const validTargets = Object.values(targets).filter(t => t !== null).length;

      this.logger.logDebug('ActionResolverDomainService', 'All possible targets retrieved', {
        totalTargets: Object.keys(targets).length,
        validTargets,
        retrievalTimeMs: retrievalTime
      });

      return {
        targets,
        retrievalTime
      };

    } catch (error) {
      const retrievalTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('ActionResolverDomainService', 'All possible targets retrieval failed', {
        error: err.message,
        retrievalTimeMs: retrievalTime
      });

      throw new ValidationError(`All possible targets retrieval failed: ${err.message}`);
    }
  }

  /**
   * Validate rules configuration
   */
  validateRulesConfiguration(request: ActionResolverRulesValidationRequest): ActionResolverRulesValidationResponse {
    try {
      this.logger.logDebug('ActionResolverDomainService', 'Validating rules configuration', {
        ruleCount: request.rules.length
      });

      const validation = this.actionResolver.validateRulesConfiguration(request.rules);

      this.logger.logDebug('ActionResolverDomainService', 'Rules configuration validation completed', {
        valid: validation.valid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length
      });

      return validation;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('ActionResolverDomainService', 'Rules configuration validation failed', {
        error: err.message
      });

      return {
        valid: false,
        errors: [{ rule: request.rules[0] || { priority: 0, condition: '', target: '', action: '' }, error: err.message }],
        warnings: []
      };
    }
  }

  /**
   * Analyze action patterns for a participant
   */
  analyzeActionPatterns(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[],
    simulations: number = 10
  ): {
    commonActions: Array<{ action: string; count: number; percentage: number }>;
    commonTargets: Array<{ target: string; count: number; percentage: number }>;
    averageResolutionTime: number;
    analysisTime: number;
  } {
    const startTime = Date.now();
    const actionCounts = new Map<string, number>();
    const targetCounts = new Map<string, number>();
    let totalResolutionTime = 0;

    try {
      this.logger.logDebug('ActionResolverDomainService', 'Analyzing action patterns', {
        actorId: actor.id,
        actorName: actor.name,
        simulations
      });

      for (let i = 0; i < simulations; i++) {
        const resolutionStart = Date.now();

        const resolvedAction = this.actionResolver.resolveAction(
          actor,
          allies,
          enemies,
          i + 1
        );

        const resolutionTime = Date.now() - resolutionStart;
        totalResolutionTime += resolutionTime;

        if (resolvedAction) {
          // Count actions
          const actionKey = resolvedAction.skillId
            ? `cast:${resolvedAction.skillId}`
            : 'attack';
          actionCounts.set(actionKey, (actionCounts.get(actionKey) || 0) + 1);

          // Count targets
          if (resolvedAction.targetName) {
            targetCounts.set(resolvedAction.targetName, (targetCounts.get(resolvedAction.targetName) || 0) + 1);
          }
        }
      }

      const totalActions = simulations;
      const commonActions = Array.from(actionCounts.entries())
        .map(([action, count]) => ({
          action,
          count,
          percentage: (count / totalActions) * 100
        }))
        .sort((a, b) => b.count - a.count);

      const commonTargets = Array.from(targetCounts.entries())
        .map(([target, count]) => ({
          target,
          count,
          percentage: (count / totalActions) * 100
        }))
        .sort((a, b) => b.count - a.count);

      const averageResolutionTime = totalResolutionTime / simulations;
      const analysisTime = Date.now() - startTime;

      this.logger.logDebug('ActionResolverDomainService', 'Action patterns analysis completed', {
        simulations,
        uniqueActions: commonActions.length,
        uniqueTargets: commonTargets.length,
        averageResolutionTimeMs: averageResolutionTime,
        analysisTimeMs: analysisTime
      });

      return {
        commonActions,
        commonTargets,
        averageResolutionTime,
        analysisTime
      };

    } catch (error) {
      const analysisTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('ActionResolverDomainService', 'Action patterns analysis failed', {
        error: err.message,
        analysisTimeMs: analysisTime
      });

      throw new ValidationError(`Action patterns analysis failed: ${err.message}`);
    }
  }

  /**
   * Get the underlying ActionResolver instance for advanced operations
   */
  getActionResolver(): ActionResolver {
    return this.actionResolver;
  }
}