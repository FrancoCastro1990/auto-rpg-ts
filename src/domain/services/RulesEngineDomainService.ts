import { RulesEngineWrapper, BattleFacts, RuleResult } from '../../systems/RulesEngine';
import { BattleParticipant, Rule } from '../../models/types';
import { ValidationError, ConfigurationError } from '../../utils/errors';
import { BattleLogger } from '../../utils/BattleLogger';

export interface RulesEvaluationRequest {
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
}

export interface RulesEvaluationResponse {
  results: RuleResult[];
  bestAction: RuleResult | null;
  facts: BattleFacts;
  evaluationTime: number;
}

export interface RuleValidationRequest {
  rule: Rule;
}

export interface RuleValidationResponse {
  valid: boolean;
  errors: string[];
}

export interface RulesValidationRequest {
  rules: Rule[];
}

export interface RulesValidationResponse {
  valid: boolean;
  ruleErrors: Array<{ rule: Rule; errors: string[] }>;
}

export interface RuleTestRequest {
  rule: Rule;
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
}

export interface RuleTestResponse {
  triggered: boolean;
  facts: BattleFacts;
  testTime: number;
}

export class RulesEngineDomainService {
  private rulesEngine: RulesEngineWrapper;
  private logger: BattleLogger;

  constructor(logger?: BattleLogger) {
    this.rulesEngine = new RulesEngineWrapper();
    this.logger = logger || new BattleLogger();
  }

  /**
   * Evaluate rules for a battle participant
   */
  async evaluateRules(request: RulesEvaluationRequest): Promise<RulesEvaluationResponse> {
    const startTime = Date.now();

    try {
      this.logger.logDebug('RulesEngineDomainService', 'Evaluating rules', {
        actorId: request.actor.id,
        actorName: request.actor.name,
        ruleCount: request.actor.rules?.length || 0,
        allyCount: request.allies.length,
        enemyCount: request.enemies.length
      });

      // Validate input
      this.validateEvaluationRequest(request);

      // Create battle facts for logging
      const facts = this.createBattleFacts(request.actor, request.allies, request.enemies);

      // Evaluate rules
      const results = await this.rulesEngine.evaluateRules(
        request.actor,
        request.allies,
        request.enemies
      );

      // Select best action
      const bestAction = await this.rulesEngine.selectBestAction(
        request.actor,
        request.allies,
        request.enemies
      );

      const evaluationTime = Date.now() - startTime;

      this.logger.logDebug('RulesEngineDomainService', 'Rules evaluation completed', {
        resultCount: results.length,
        successfulRules: results.filter(r => r.success).length,
        bestActionSelected: bestAction !== null,
        evaluationTimeMs: evaluationTime
      });

      return {
        results,
        bestAction,
        facts,
        evaluationTime
      };

    } catch (error) {
      const evaluationTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('RulesEngineDomainService', 'Rules evaluation failed', {
        actorId: request.actor.id,
        error: err.message,
        evaluationTimeMs: evaluationTime
      });

      throw new ValidationError(`Rules evaluation failed: ${err.message}`);
    }
  }

  /**
   * Validate a single rule
   */
  validateRule(request: RuleValidationRequest): RuleValidationResponse {
    try {
      this.logger.logDebug('RulesEngineDomainService', 'Validating rule', {
        condition: request.rule.condition,
        target: request.rule.target,
        action: request.rule.action
      });

      const validation = this.rulesEngine.validateRule(request.rule);

      this.logger.logDebug('RulesEngineDomainService', 'Rule validation completed', {
        valid: validation.valid,
        errorCount: validation.errors.length
      });

      return validation;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('RulesEngineDomainService', 'Rule validation failed', {
        error: err.message
      });

      return {
        valid: false,
        errors: [err.message]
      };
    }
  }

  /**
   * Validate multiple rules
   */
  validateRules(request: RulesValidationRequest): RulesValidationResponse {
    try {
      this.logger.logDebug('RulesEngineDomainService', 'Validating rules batch', {
        ruleCount: request.rules.length
      });

      const validation = this.rulesEngine.validateAllRules(request.rules);

      this.logger.logDebug('RulesEngineDomainService', 'Rules batch validation completed', {
        valid: validation.valid,
        invalidRuleCount: validation.ruleErrors.length
      });

      return validation;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('RulesEngineDomainService', 'Rules batch validation failed', {
        error: err.message
      });

      return {
        valid: false,
        ruleErrors: request.rules.map(rule => ({ rule, errors: [err.message] }))
      };
    }
  }

  /**
   * Test a rule against specific battle conditions
   */
  async testRule(request: RuleTestRequest): Promise<RuleTestResponse> {
    const startTime = Date.now();

    try {
      this.logger.logDebug('RulesEngineDomainService', 'Testing rule', {
        condition: request.rule.condition,
        actorId: request.actor.id,
        actorName: request.actor.name
      });

      const result = await this.rulesEngine.testRule(
        request.rule,
        request.actor,
        request.allies,
        request.enemies
      );

      const testTime = Date.now() - startTime;

      this.logger.logDebug('RulesEngineDomainService', 'Rule test completed', {
        triggered: result.triggered,
        testTimeMs: testTime
      });

      return {
        triggered: result.triggered,
        facts: result.facts,
        testTime
      };

    } catch (error) {
      const testTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError('RulesEngineDomainService', 'Rule test failed', {
        error: err.message,
        testTimeMs: testTime
      });

      throw new ValidationError(`Rule test failed: ${err.message}`);
    }
  }

  /**
   * Get battle facts for analysis
   */
  getBattleFacts(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): BattleFacts {
    try {
      return this.createBattleFacts(actor, allies, enemies);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.logError('RulesEngineDomainService', 'Failed to create battle facts', {
        error: err.message
      });
      throw new ValidationError(`Failed to create battle facts: ${err.message}`);
    }
  }

  /**
   * Private helper methods
   */
  private validateEvaluationRequest(request: RulesEvaluationRequest): void {
    if (!request.actor || typeof request.actor !== 'object') {
      throw new ValidationError('Actor must be a valid BattleParticipant object');
    }

    if (!Array.isArray(request.allies)) {
      throw new ValidationError('Allies must be an array');
    }

    if (!Array.isArray(request.enemies)) {
      throw new ValidationError('Enemies must be an array');
    }

    if (!request.actor.rules || !Array.isArray(request.actor.rules)) {
      throw new ValidationError('Actor must have a valid rules array');
    }

    if (request.actor.rules.length === 0) {
      throw new ValidationError('Actor must have at least one rule');
    }
  }

  private createBattleFacts(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): BattleFacts {
    // This mirrors the logic in RulesEngineWrapper but is duplicated here for encapsulation
    const livingAllies = allies.filter(a => a.isAlive);
    const livingEnemies = enemies.filter(e => e.isAlive);

    const lowestAllyHpPercentage = livingAllies.length > 0
      ? Math.min(...livingAllies.map(a => (a.currentStats.hp / a.maxStats.hp) * 100))
      : 100;

    return {
      actor: {
        id: actor.id,
        name: actor.name,
        hp: actor.currentStats.hp,
        maxHp: actor.maxStats.hp,
        mp: actor.currentStats.mp,
        maxMp: actor.maxStats.mp,
        hpPercentage: (actor.currentStats.hp / actor.maxStats.hp) * 100,
        mpPercentage: (actor.currentStats.mp / actor.maxStats.mp) * 100,
        isAlive: actor.isAlive,
        isEnemy: actor.isEnemy,
        isBoss: actor.isBoss || false
      },
      allies: allies.map(ally => ({
        id: ally.id,
        name: ally.name,
        hp: ally.currentStats.hp,
        maxHp: ally.maxStats.hp,
        hpPercentage: (ally.currentStats.hp / ally.maxStats.hp) * 100,
        isAlive: ally.isAlive
      })),
      enemies: enemies.map(enemy => ({
        id: enemy.id,
        name: enemy.name,
        hp: enemy.currentStats.hp,
        maxHp: enemy.maxStats.hp,
        hpPercentage: (enemy.currentStats.hp / enemy.maxStats.hp) * 100,
        isAlive: enemy.isAlive,
        isBoss: enemy.isBoss || false
      })),
      allyCount: allies.length,
      enemyCount: enemies.length,
      livingAllies: livingAllies.length,
      livingEnemies: livingEnemies.length,
      hasBossEnemy: enemies.some(e => e.isAlive && e.isBoss),
      lowestAllyHpPercentage,
      always: true
    };
  }
}