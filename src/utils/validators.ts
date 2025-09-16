import { Stats, Rule, Ability } from '../models/types';

export class ValidationError extends Error {
  constructor(message: string, public readonly context?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const VALID_CONDITIONS = [
  'always',
  'enemy.isBoss',
  'ally.hp < 30%',
  'ally.hp < 50%',
  'ally.hp < 60%',
  'self.mp > 30%',
  'self.mp > 50%',
  'self.mp > 70%',
  'enemy.count > 1',
  'enemy.count > 2'
] as const;

export const VALID_TARGETS = [
  'weakestEnemy',
  'strongestEnemy',
  'lowestHpAlly',
  'randomAlly',
  'randomEnemy',
  'bossEnemy',
  'self'
] as const;

export const VALID_ABILITY_TYPES = [
  'attack',
  'heal',
  'buff',
  'debuff'
] as const;

export function validateStats(stats: any, context: string = 'stats'): Stats {
  if (!stats || typeof stats !== 'object') {
    throw new ValidationError(`Invalid stats object`, context);
  }

  const requiredProps: (keyof Stats)[] = ['hp', 'mp', 'str', 'def', 'mag', 'spd'];

  for (const prop of requiredProps) {
    if (typeof stats[prop] !== 'number') {
      throw new ValidationError(`Property '${prop}' must be a number`, context);
    }
    if (stats[prop] < 0) {
      throw new ValidationError(`Property '${prop}' cannot be negative`, context);
    }
  }

  return {
    hp: stats.hp,
    mp: stats.mp,
    str: stats.str,
    def: stats.def,
    mag: stats.mag,
    spd: stats.spd
  };
}

export function validateRule(rule: any, context: string = 'rule'): Rule {
  if (!rule || typeof rule !== 'object') {
    throw new ValidationError(`Invalid rule object`, context);
  }

  if (typeof rule.priority !== 'number' || rule.priority < 0) {
    throw new ValidationError(`Priority must be a non-negative number`, context);
  }

  if (typeof rule.condition !== 'string' || !rule.condition.trim()) {
    throw new ValidationError(`Condition must be a non-empty string`, context);
  }

  if (typeof rule.target !== 'string' || !rule.target.trim()) {
    throw new ValidationError(`Target must be a non-empty string`, context);
  }

  if (typeof rule.action !== 'string' || !rule.action.trim()) {
    throw new ValidationError(`Action must be a non-empty string`, context);
  }

  return {
    priority: rule.priority,
    condition: rule.condition,
    target: rule.target,
    action: rule.action
  };
}

export function validateAbility(ability: any, context: string = 'ability'): Ability {
  if (!ability || typeof ability !== 'object') {
    throw new ValidationError(`Invalid ability object`, context);
  }

  if (typeof ability.name !== 'string' || !ability.name.trim()) {
    throw new ValidationError(`Name must be a non-empty string`, context);
  }

  if (!VALID_ABILITY_TYPES.includes(ability.type)) {
    throw new ValidationError(
      `Type must be one of: ${VALID_ABILITY_TYPES.join(', ')}`,
      context
    );
  }

  if (typeof ability.mpCost !== 'number' || ability.mpCost < 0) {
    throw new ValidationError(`MP cost must be a non-negative number`, context);
  }

  if (!ability.effect || typeof ability.effect !== 'object') {
    throw new ValidationError(`Effect must be an object`, context);
  }

  return {
    name: ability.name,
    type: ability.type,
    effect: ability.effect,
    mpCost: ability.mpCost,
    description: ability.description || ''
  };
}

export function validateCondition(condition: string, context: string = 'condition'): boolean {
  const normalizedCondition = condition.trim();

  if (VALID_CONDITIONS.includes(normalizedCondition as any)) {
    return true;
  }

  const percentagePattern = /^(ally|self)\.(hp|mp)\s*(<|>)\s*\d+%$/;
  const countPattern = /^enemy\.count\s*>\s*\d+$/;

  if (percentagePattern.test(normalizedCondition) || countPattern.test(normalizedCondition)) {
    return true;
  }

  throw new ValidationError(
    `Invalid condition: ${condition}. Must be one of predefined conditions or match pattern.`,
    context
  );
}

export function validateTarget(target: string, context: string = 'target'): boolean {
  if (VALID_TARGETS.includes(target as any)) {
    return true;
  }

  throw new ValidationError(
    `Invalid target: ${target}. Must be one of: ${VALID_TARGETS.join(', ')}`,
    context
  );
}

export function validateAction(action: string, context: string = 'action'): { type: 'attack' | 'cast'; skillId?: string } {
  if (action === 'attack') {
    return { type: 'attack' };
  }

  const castPattern = /^cast:(.+)$/;
  const match = action.match(castPattern);

  if (match) {
    const skillId = match[1]?.trim();
    if (!skillId) {
      throw new ValidationError(`Cast action must specify a skill ID`, context);
    }
    return { type: 'cast', skillId };
  }

  throw new ValidationError(
    `Invalid action: ${action}. Must be 'attack' or 'cast:skillId'`,
    context
  );
}

export function validateJsonStructure(data: any, expectedStructure: string, context: string = 'data'): void {
  if (expectedStructure === 'array' && !Array.isArray(data)) {
    throw new ValidationError(`Expected an array`, context);
  }

  if (expectedStructure === 'object' && (!data || typeof data !== 'object' || Array.isArray(data))) {
    throw new ValidationError(`Expected an object`, context);
  }
}

export function sanitizeSkillId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function validateSkillReference(skillId: string, availableSkills: Set<string>, context: string = 'skill reference'): void {
  if (!availableSkills.has(skillId)) {
    throw new ValidationError(
      `Unknown skill reference: ${skillId}. Available skills: ${Array.from(availableSkills).join(', ')}`,
      context
    );
  }
}