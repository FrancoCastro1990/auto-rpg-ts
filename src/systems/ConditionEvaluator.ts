import { BattleParticipant, Rule } from '../models/types';

export interface ConditionContext {
  actor: BattleParticipant;
  allies: BattleParticipant[];
  enemies: BattleParticipant[];
  livingAllies: BattleParticipant[];
  livingEnemies: BattleParticipant[];
  turnNumber: number;
}

export class ConditionEvaluator {

  evaluateCondition(condition: string, context: ConditionContext): boolean {
    const trimmed = condition.trim().toLowerCase();

    switch (trimmed) {
      case 'always':
        return true;

      case 'enemy.isboss':
        return context.livingEnemies.some(enemy => enemy.isBoss);

      default:
        return this.evaluateComplexCondition(trimmed, context);
    }
  }

  private evaluateComplexCondition(condition: string, context: ConditionContext): boolean {
    const hpConditionMatch = condition.match(/^(ally|self)\.hp\s*<\s*(\d+)%$/);
    if (hpConditionMatch) {
      const [, target, percentageStr] = hpConditionMatch;
      const percentage = parseInt(percentageStr || '0');

      if (target === 'self') {
        const actorHpPercentage = (context.actor.currentStats.hp / context.actor.maxStats.hp) * 100;
        return actorHpPercentage < percentage;
      } else if (target === 'ally') {
        return context.livingAllies.some(ally => {
          const allyHpPercentage = (ally.currentStats.hp / ally.maxStats.hp) * 100;
          return allyHpPercentage < percentage;
        });
      }
    }

    const mpConditionMatch = condition.match(/^self\.mp\s*>\s*(\d+)%$/);
    if (mpConditionMatch) {
      const percentage = parseInt(mpConditionMatch[1] || '0');
      const actorMpPercentage = (context.actor.currentStats.mp / context.actor.maxStats.mp) * 100;
      return actorMpPercentage > percentage;
    }

    const enemyCountMatch = condition.match(/^enemy\.count\s*>\s*(\d+)$/);
    if (enemyCountMatch) {
      const count = parseInt(enemyCountMatch[1] || '0');
      return context.livingEnemies.length > count;
    }

    const allyCountMatch = condition.match(/^ally\.count\s*>\s*(\d+)$/);
    if (allyCountMatch) {
      const count = parseInt(allyCountMatch[1] || '0');
      return context.livingAllies.length > count;
    }

    const turnConditionMatch = condition.match(/^turn\s*>\s*(\d+)$/);
    if (turnConditionMatch) {
      const turn = parseInt(turnConditionMatch[1] || '0');
      return context.turnNumber > turn;
    }

    const selfHpConditionMatch = condition.match(/^self\.hp\s*<\s*(\d+)$/);
    if (selfHpConditionMatch) {
      const threshold = parseInt(selfHpConditionMatch[1] || '0');
      return context.actor.currentStats.hp < threshold;
    }

    const selfMpConditionMatch = condition.match(/^self\.mp\s*>\s*(\d+)$/);
    if (selfMpConditionMatch) {
      const threshold = parseInt(selfMpConditionMatch[1] || '0');
      return context.actor.currentStats.mp > threshold;
    }

    console.warn(`Unknown condition: ${condition}`);
    return false;
  }

  evaluateRules(rules: Rule[], context: ConditionContext): Rule | null {
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.evaluateCondition(rule.condition, context)) {
        return rule;
      }
    }

    return null;
  }

  getMatchingRules(rules: Rule[], context: ConditionContext): Array<{ rule: Rule; evaluation: boolean }> {
    return rules.map(rule => ({
      rule,
      evaluation: this.evaluateCondition(rule.condition, context)
    }));
  }

  validateConditionSyntax(condition: string): { valid: boolean; error?: string } {
    const trimmed = condition.trim().toLowerCase();

    const validSimpleConditions = ['always', 'enemy.isboss'];
    if (validSimpleConditions.includes(trimmed)) {
      return { valid: true };
    }

    const validPatterns = [
      /^(ally|self)\.hp\s*<\s*\d+%$/,
      /^self\.mp\s*>\s*\d+%$/,
      /^(enemy|ally)\.count\s*>\s*\d+$/,
      /^turn\s*>\s*\d+$/,
      /^self\.hp\s*<\s*\d+$/,
      /^self\.mp\s*>\s*\d+$/
    ];

    for (const pattern of validPatterns) {
      if (pattern.test(trimmed)) {
        return { valid: true };
      }
    }

    return {
      valid: false,
      error: `Invalid condition syntax: ${condition}. Valid patterns: always, enemy.isBoss, ally/self.hp < X%, self.mp > X%, enemy/ally.count > X, turn > X`
    };
  }

  listSupportedConditions(): string[] {
    return [
      'always',
      'enemy.isBoss',
      'ally.hp < X%',
      'self.hp < X%',
      'self.mp > X%',
      'enemy.count > X',
      'ally.count > X',
      'turn > X',
      'self.hp < X',
      'self.mp > X'
    ];
  }

  createTestContext(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[],
    turnNumber: number = 1
  ): ConditionContext {
    return {
      actor,
      allies,
      enemies,
      livingAllies: allies.filter(a => a.isAlive),
      livingEnemies: enemies.filter(e => e.isAlive),
      turnNumber
    };
  }

  debugRule(rule: Rule, context: ConditionContext): {
    rule: Rule;
    evaluation: boolean;
    contextSnapshot: {
      actorHp: number;
      actorMp: number;
      livingAllies: number;
      livingEnemies: number;
      hasBoss: boolean;
      turn: number;
    };
  } {
    const evaluation = this.evaluateCondition(rule.condition, context);

    return {
      rule,
      evaluation,
      contextSnapshot: {
        actorHp: Math.round((context.actor.currentStats.hp / context.actor.maxStats.hp) * 100),
        actorMp: Math.round((context.actor.currentStats.mp / context.actor.maxStats.mp) * 100),
        livingAllies: context.livingAllies.length,
        livingEnemies: context.livingEnemies.length,
        hasBoss: context.livingEnemies.some(e => e.isBoss),
        turn: context.turnNumber
      }
    };
  }
}