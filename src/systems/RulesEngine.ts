import { Engine, Rule as JsonRule } from 'json-rules-engine';
import { BattleParticipant, Rule, Action } from '../models/types';

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
      if (target === 'self') {
        return { path: 'actor.hpPercentage', operator: 'percentageLessThan', value: parseInt(percentage || '0') };
      } else {
        return { path: 'lowestAllyHpPercentage', operator: 'percentageLessThan', value: parseInt(percentage || '0') };
      }
    }

    const mpPercentageMatch = trimmed.match(/^self\.mp\s*>\s*(\d+)%$/);
    if (mpPercentageMatch) {
      const percentage = parseInt(mpPercentageMatch[1] || '0');
      return { path: 'actor.mpPercentage', operator: 'percentageGreaterThan', value: percentage };
    }

    const enemyCountMatch = trimmed.match(/^enemy\.count\s*>\s*(\d+)$/);
    if (enemyCountMatch) {
      const count = parseInt(enemyCountMatch[1] || '0');
      return { path: 'livingEnemies', operator: 'countGreaterThan', value: count };
    }

    const allyCountMatch = trimmed.match(/^ally\.count\s*>\s*(\d+)$/);
    if (allyCountMatch) {
      const count = parseInt(allyCountMatch[1] || '0');
      return { path: 'livingAllies', operator: 'countGreaterThan', value: count };
    }

    throw new Error(`Unsupported condition: ${condition}`);
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
    const facts = this.createBattleFacts(actor, allies, enemies);

    const results: RuleResult[] = [];

    const sortedRules = [...actor.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
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
        console.warn(`Failed to evaluate rule: ${rule.condition}`, error);
        results.push({
          rule,
          priority: rule.priority,
          target: rule.target,
          action: rule.action,
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
    const results = await this.evaluateRules(actor, allies, enemies);

    const successfulRules = results.filter(r => r.success);

    if (successfulRules.length === 0) {
      return null;
    }

    return successfulRules[0] || null;
  }

  validateRule(rule: Rule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.parseCondition(rule.condition);
    } catch (error) {
      errors.push(`Invalid condition: ${rule.condition}`);
    }

    const validTargets = [
      'weakestEnemy', 'strongestEnemy', 'lowestHpAlly',
      'randomAlly', 'randomEnemy', 'bossEnemy', 'self'
    ];

    if (!validTargets.includes(rule.target)) {
      errors.push(`Invalid target: ${rule.target}`);
    }

    if (!rule.action.match(/^(attack|cast:.+)$/)) {
      errors.push(`Invalid action format: ${rule.action}`);
    }

    if (rule.priority < 0 || rule.priority > 1000) {
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
    const facts = this.createBattleFacts(actor, allies, enemies);

    try {
      const triggered = this.evaluateConditionDirect(rule.condition, facts);

      return {
        triggered,
        facts
      };
    } catch (error) {
      return {
        triggered: false,
        facts
      };
    }
  }
}