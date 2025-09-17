import { Engine, Rule as JsonRule } from 'json-rules-engine';
import { BattleParticipant, Rule, Action } from '../models/types';
import { ValidationError, ConfigurationError, ErrorHandler } from '../utils/errors';

export interface BattleFacts {
  actor: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    hpPercentage: number;
    mpPercentage: number;
    isAlive: boolean;
    isEnemy: boolean;
    isBoss: boolean;
  };
  allies: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    hpPercentage: number;
    isAlive: boolean;
  }>;
  enemies: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    hpPercentage: number;
    isAlive: boolean;
    isBoss: boolean;
  }>;
  allyCount: number;
  enemyCount: number;
  livingAllies: number;
  livingEnemies: number;
  hasBossEnemy: boolean;
  lowestAllyHpPercentage: number;
  always: boolean;
}

export interface RuleResult {
  rule: Rule;
  priority: number;
  target: string;
  action: string;
  success: boolean;
}

export class RulesEngineWrapper {
  private engine: Engine;

  constructor() {
    this.engine = new Engine();
    this.setupCustomOperators();
  }

  private setupCustomOperators(): void {
    this.engine.addOperator('percentageLessThan', (factValue: number, jsonValue: number) => {
      return factValue < jsonValue;
    });

    this.engine.addOperator('percentageGreaterThan', (factValue: number, jsonValue: number) => {
      return factValue > jsonValue;
    });

    this.engine.addOperator('countGreaterThan', (factValue: number, jsonValue: number) => {
      return factValue > jsonValue;
    });
  }

  private parseCondition(condition: string): { path: string; operator: string; value: any } {
    if (!condition || typeof condition !== 'string') {
      throw new ValidationError('Condition must be a non-empty string');
    }

    const trimmed = condition.trim();

    if (trimmed === 'always') {
      return { path: 'always', operator: 'equal', value: true };
    }

    if (trimmed === 'enemy.isBoss') {
      return { path: 'hasBossEnemy', operator: 'equal', value: true };
    }

    const hpPercentageMatch = trimmed.match(/^(ally|self)\.hp\s*<\s*(\d+)%$/);
    if (hpPercentageMatch) {
      const [, target, percentage] = hpPercentageMatch;
      const percentValue = parseInt(percentage || '0');

      if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
        throw new ValidationError(`Invalid percentage value in condition: ${condition}`);
      }

      if (target === 'self') {
        return { path: 'actor.hpPercentage', operator: 'percentageLessThan', value: percentValue };
      } else {
        return { path: 'lowestAllyHpPercentage', operator: 'percentageLessThan', value: percentValue };
      }
    }

    const mpPercentageMatch = trimmed.match(/^self\.mp\s*>\s*(\d+)%$/);
    if (mpPercentageMatch) {
      const percentValue = parseInt(mpPercentageMatch[1] || '0');

      if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
        throw new ValidationError(`Invalid percentage value in condition: ${condition}`);
      }

      return { path: 'actor.mpPercentage', operator: 'percentageGreaterThan', value: percentValue };
    }

    const enemyCountMatch = trimmed.match(/^enemy\.count\s*>\s*(\d+)$/);
    if (enemyCountMatch) {
      const countValue = parseInt(enemyCountMatch[1] || '0');

      if (isNaN(countValue) || countValue < 0) {
        throw new ValidationError(`Invalid count value in condition: ${condition}`);
      }

      return { path: 'livingEnemies', operator: 'countGreaterThan', value: countValue };
    }

    const allyCountMatch = trimmed.match(/^ally\.count\s*>\s*(\d+)$/);
    if (allyCountMatch) {
      const countValue = parseInt(allyCountMatch[1] || '0');

      if (isNaN(countValue) || countValue < 0) {
        throw new ValidationError(`Invalid count value in condition: ${condition}`);
      }

      return { path: 'livingAllies', operator: 'countGreaterThan', value: countValue };
    }

    throw new ValidationError(`Unsupported condition format: ${condition}`);
  }

  private evaluateConditionDirect(condition: string, facts: BattleFacts): boolean {
    const trimmed = condition.trim();

    if (trimmed === 'always') {
      return facts.always;
    }

    if (trimmed === 'enemy.isBoss') {
      return facts.hasBossEnemy;
    }

    const hpPercentageMatch = trimmed.match(/^(ally|self)\.hp\s*<\s*(\d+)%$/);
    if (hpPercentageMatch) {
      const [, target, percentage] = hpPercentageMatch;
      const threshold = parseInt(percentage || '0');

      if (target === 'self') {
        return facts.actor.hpPercentage < threshold;
      } else {
        return facts.lowestAllyHpPercentage < threshold;
      }
    }

    const mpPercentageMatch = trimmed.match(/^self\.mp\s*>\s*(\d+)%$/);
    if (mpPercentageMatch) {
      const threshold = parseInt(mpPercentageMatch[1] || '0');
      return facts.actor.mpPercentage > threshold;
    }

    const enemyCountMatch = trimmed.match(/^enemy\.count\s*>\s*(\d+)$/);
    if (enemyCountMatch) {
      const threshold = parseInt(enemyCountMatch[1] || '0');
      return facts.livingEnemies > threshold;
    }

    const allyCountMatch = trimmed.match(/^ally\.count\s*>\s*(\d+)$/);
    if (allyCountMatch) {
      const threshold = parseInt(allyCountMatch[1] || '0');
      return facts.livingAllies > threshold;
    }

    console.warn(`Unknown condition: ${condition}`);
    return false;
  }

  private createBattleFacts(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): BattleFacts {
    // Validar entrada
    if (!actor || typeof actor !== 'object') {
      throw new ValidationError('Actor must be a valid BattleParticipant object');
    }

    if (!Array.isArray(allies)) {
      throw new ValidationError('Allies must be an array');
    }

    if (!Array.isArray(enemies)) {
      throw new ValidationError('Enemies must be an array');
    }

    // Validar que el actor tenga las propiedades necesarias
    if (!actor.id || !actor.name || !actor.currentStats || !actor.maxStats) {
      throw new ValidationError('Actor is missing required properties');
    }

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

  async evaluateRules(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): Promise<RuleResult[]> {
    // Validar entrada
    if (!actor || typeof actor !== 'object') {
      throw new ValidationError('Actor must be a valid BattleParticipant object');
    }

    if (!Array.isArray(allies)) {
      throw new ValidationError('Allies must be an array');
    }

    if (!Array.isArray(enemies)) {
      throw new ValidationError('Enemies must be an array');
    }

    if (!actor.rules || !Array.isArray(actor.rules)) {
      throw new ValidationError('Actor must have a valid rules array');
    }

    const facts = this.createBattleFacts(actor, allies, enemies);
    const results: RuleResult[] = [];
    const sortedRules = [...actor.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        if (!rule || typeof rule !== 'object') {
          throw new ValidationError('Invalid rule object');
        }

        if (!rule.condition || typeof rule.condition !== 'string') {
          throw new ValidationError('Rule must have a valid condition string');
        }

        const success = this.evaluateConditionDirect(rule.condition, facts);

        results.push({
          rule,
          priority: rule.priority,
          target: rule.target,
          action: rule.action,
          success
        });

        if (success) {
          break;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.warn(`Failed to evaluate rule: ${rule?.condition || 'unknown'}`, err.message);

        results.push({
          rule,
          priority: rule.priority || 0,
          target: rule.target || 'self',
          action: rule.action || 'skip',
          success: false
        });
      }
    }

    return results;
  }

  async selectBestAction(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): Promise<RuleResult | null> {
    // Validar entrada
    if (!actor || typeof actor !== 'object') {
      throw new ValidationError('Actor must be a valid BattleParticipant object');
    }

    if (!Array.isArray(allies)) {
      throw new ValidationError('Allies must be an array');
    }

    if (!Array.isArray(enemies)) {
      throw new ValidationError('Enemies must be an array');
    }

    const results = await this.evaluateRules(actor, allies, enemies);
    const successfulRules = results.filter(r => r.success);

    if (successfulRules.length === 0) {
      return null;
    }

    return successfulRules[0] || null;
  }

  validateRule(rule: Rule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar que la regla sea un objeto válido
    if (!rule || typeof rule !== 'object') {
      errors.push('Rule must be a valid object');
      return { valid: false, errors };
    }

    // Validar condición
    if (!rule.condition || typeof rule.condition !== 'string') {
      errors.push('Rule must have a valid condition string');
    } else {
      try {
        this.parseCondition(rule.condition);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(`Invalid condition: ${err.message}`);
      }
    }

    // Validar target
    const validTargets = [
      'weakestEnemy', 'strongestEnemy', 'lowestHpAlly',
      'randomAlly', 'randomEnemy', 'bossEnemy', 'self'
    ];

    if (!rule.target || typeof rule.target !== 'string') {
      errors.push('Rule must have a valid target string');
    } else if (!validTargets.includes(rule.target)) {
      errors.push(`Invalid target: ${rule.target}. Valid targets: ${validTargets.join(', ')}`);
    }

    // Validar action
    if (!rule.action || typeof rule.action !== 'string') {
      errors.push('Rule must have a valid action string');
    } else if (!rule.action.match(/^(attack|cast:.+)$/)) {
      errors.push(`Invalid action format: ${rule.action}. Must be 'attack' or 'cast:skillName'`);
    }

    // Validar priority
    if (typeof rule.priority !== 'number' || isNaN(rule.priority)) {
      errors.push('Rule priority must be a valid number');
    } else if (rule.priority < 0 || rule.priority > 1000) {
      errors.push(`Priority should be between 0 and 1000: ${rule.priority}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateAllRules(rules: Rule[]): { valid: boolean; ruleErrors: Array<{ rule: Rule; errors: string[] }> } {
    const ruleErrors: Array<{ rule: Rule; errors: string[] }> = [];

    for (const rule of rules) {
      const validation = this.validateRule(rule);
      if (!validation.valid) {
        ruleErrors.push({ rule, errors: validation.errors });
      }
    }

    return {
      valid: ruleErrors.length === 0,
      ruleErrors
    };
  }

  async testRule(
    rule: Rule,
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): Promise<{ triggered: boolean; facts: BattleFacts }> {
    // Validar entrada
    if (!rule || typeof rule !== 'object') {
      throw new ValidationError('Rule must be a valid object');
    }

    if (!actor || typeof actor !== 'object') {
      throw new ValidationError('Actor must be a valid BattleParticipant object');
    }

    if (!Array.isArray(allies)) {
      throw new ValidationError('Allies must be an array');
    }

    if (!Array.isArray(enemies)) {
      throw new ValidationError('Enemies must be an array');
    }

    const facts = this.createBattleFacts(actor, allies, enemies);

    try {
      if (!rule.condition || typeof rule.condition !== 'string') {
        throw new ValidationError('Rule must have a valid condition string');
      }

      const triggered = this.evaluateConditionDirect(rule.condition, facts);

      return {
        triggered,
        facts
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.warn(`Failed to test rule: ${err.message}`);

      return {
        triggered: false,
        facts
      };
    }
  }
}

export { RulesEngineWrapper as RulesEngine };