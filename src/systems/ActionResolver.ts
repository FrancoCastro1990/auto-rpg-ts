import { BattleParticipant, Rule, Action } from '../models/types';
import { ConditionEvaluator, ConditionContext } from './ConditionEvaluator';
import { TargetSelector, TargetType } from './TargetSelector';

export interface ResolvedAction {
  rule: Rule;
  actionType: 'attack' | 'cast';
  skillId?: string | undefined;
  targetId?: string | undefined;
  targetName?: string | undefined;
  priority: number;
  success: boolean;
  message: string;
}

export class ActionResolver {
  private conditionEvaluator: ConditionEvaluator;

  constructor() {
    this.conditionEvaluator = new ConditionEvaluator();
  }

  resolveAction(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[],
    turnNumber: number = 1
  ): ResolvedAction | null {
    const context = this.conditionEvaluator.createTestContext(actor, allies, enemies, turnNumber);

    const selectedRule = this.conditionEvaluator.evaluateRules(actor.rules, context);

    if (!selectedRule) {
      return {
        rule: {
          priority: 0,
          condition: 'fallback',
          target: 'randomEnemy',
          action: 'attack'
        },
        actionType: 'attack',
        priority: 0,
        success: true,
        message: `${actor.name} performs a basic attack (no rules matched)`
      };
    }

    const target = this.resolveTarget(selectedRule.target, context);

    // DEBUG: Log target selection
    console.log(`DEBUG: ${actor.name} selected rule: ${selectedRule.condition} -> ${selectedRule.target} -> ${selectedRule.action}`);
    console.log(`DEBUG: Available allies: ${allies.map(a => `${a.name}(${a.currentStats.hp}/${a.maxStats.hp} HP)`).join(', ')}`);
    console.log(`DEBUG: Available enemies: ${enemies.map(e => `${e.name}(${e.currentStats.hp}/${e.maxStats.hp} HP)`).join(', ')}`);
    console.log(`DEBUG: Selected target: ${target ? `${target.name}(${target.currentStats.hp}/${target.maxStats.hp} HP, isEnemy: ${target.isEnemy})` : 'null'}`);

    const actionParsed = this.parseAction(selectedRule.action);

    if (!target) {
      return {
        rule: selectedRule,
        actionType: 'attack',
        priority: selectedRule.priority,
        success: false,
        message: `${actor.name} cannot find a valid target for ${selectedRule.target}`
      };
    }

    // Validate MP cost and cooldown for cast actions
    if (actionParsed.type === 'cast' && actionParsed.skillId) {
      const skill = actor.abilities.find(ability =>
        ability.name.toLowerCase().replace(/\s+/g, '_') === actionParsed.skillId
      );

      if (skill) {
        // Check cooldown
        const isOnCooldown = actor.skillCooldowns.some(cooldown =>
          cooldown.skillName === skill.name && cooldown.remainingTurns > 0
        );

        if (isOnCooldown) {
          // Fall back to basic attack if skill is on cooldown
          const fallbackTarget = selectedRule.target === 'self' ? this.resolveTarget('randomEnemy', context) : target;
          return {
            rule: {
              priority: selectedRule.priority,
              condition: 'fallback_cooldown',
              target: selectedRule.target === 'self' ? 'randomEnemy' : selectedRule.target,
              action: 'attack'
            },
            actionType: 'attack',
            targetId: fallbackTarget?.id || target.id,
            targetName: fallbackTarget?.name || target.name,
            priority: selectedRule.priority,
            success: true,
            message: `${actor.name} attacks ${fallbackTarget?.name || target.name} (${skill.name} is on cooldown)`
          };
        }

        // Check MP cost
        if (actor.currentStats.mp < skill.mpCost) {
          // Fall back to basic attack if not enough MP
          const fallbackTarget = selectedRule.target === 'self' ? this.resolveTarget('randomEnemy', context) : target;
          return {
            rule: {
              priority: selectedRule.priority,
              condition: 'fallback_mp',
              target: selectedRule.target === 'self' ? 'randomEnemy' : selectedRule.target,
              action: 'attack'
            },
            actionType: 'attack',
            targetId: fallbackTarget?.id || target.id,
            targetName: fallbackTarget?.name || target.name,
            priority: selectedRule.priority,
            success: true,
            message: `${actor.name} attacks ${fallbackTarget?.name || target.name} (not enough MP for ${skill.name})`
          };
        }
      }
    }

    return {
      rule: selectedRule,
      actionType: actionParsed.type,
      skillId: actionParsed.skillId,
      targetId: target.id,
      targetName: target.name,
      priority: selectedRule.priority,
      success: true,
      message: this.createActionMessage(actor, target, actionParsed, selectedRule)
    };
  }

  private resolveTarget(targetType: string, context: ConditionContext): BattleParticipant | null {
    if (!TargetSelector.validateTargetType(targetType)) {
      console.warn(`Unknown target type: ${targetType}`);
      return null;
    }

    const result = TargetSelector.selectTarget(
      targetType as TargetType,
      context.actor,
      context.livingAllies,
      context.livingEnemies
    );

    return result.target;
  }

  private parseAction(action: string): { type: 'attack' | 'cast'; skillId?: string } {
    if (action === 'attack') {
      return { type: 'attack' };
    }

    const castMatch = action.match(/^cast:(.+)$/);
    if (castMatch && castMatch[1]) {
      return { type: 'cast', skillId: castMatch[1].trim() };
    }

    console.warn(`Unknown action format: ${action}, defaulting to attack`);
    return { type: 'attack' };
  }

  private createActionMessage(
    actor: BattleParticipant,
    target: BattleParticipant,
    action: { type: 'attack' | 'cast'; skillId?: string },
    rule: Rule
  ): string {
    const actionDescription = action.type === 'attack'
      ? 'attacks'
      : `casts ${action.skillId}`;

    const targetDescription = target.id === actor.id ? 'themselves' : target.name;

    return `${actor.name} ${actionDescription} ${targetDescription} (rule: ${rule.condition}, priority: ${rule.priority})`;
  }

  validateAction(
    action: ResolvedAction,
    actor: BattleParticipant,
    availableSkills: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (action.actionType === 'cast' && action.skillId) {
      const hasSkill = actor.abilities.some(ability =>
        ability.name.toLowerCase().replace(/\s+/g, '_') === action.skillId
      );

      if (!hasSkill) {
        const availableSkills = actor.abilities.map(a => a.name.toLowerCase().replace(/\s+/g, '_')).join(', ');
        errors.push(`Actor ${actor.name} does not have skill: ${action.skillId}. Available skills: ${availableSkills}`);
      }

      if (!availableSkills.includes(action.skillId)) {
        errors.push(`Skill ${action.skillId} is not in the available skills list`);
      }

      const skill = actor.abilities.find(ability =>
        ability.name.toLowerCase().replace(/\s+/g, '_') === action.skillId
      );

      if (skill) {
        // Check cooldown
        const isOnCooldown = actor.skillCooldowns.some(cooldown =>
          cooldown.skillName === skill.name && cooldown.remainingTurns > 0
        );

        if (isOnCooldown) {
          errors.push(`Skill ${action.skillId} is on cooldown`);
        }

        // Check MP cost
        if (actor.currentStats.mp < skill.mpCost) {
          errors.push(`Not enough MP to cast ${action.skillId} (need ${skill.mpCost}, have ${actor.currentStats.mp})`);
        }
      }
    }

    if (!action.targetId) {
      errors.push('No valid target found for action');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  debugActionResolution(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[],
    turnNumber: number = 1
  ): {
    context: ConditionContext;
    ruleEvaluations: Array<{ rule: Rule; evaluation: boolean }>;
    selectedRule: Rule | null;
    resolvedAction: ResolvedAction | null;
  } {
    const context = this.conditionEvaluator.createTestContext(actor, allies, enemies, turnNumber);
    const ruleEvaluations = this.conditionEvaluator.getMatchingRules(actor.rules, context);
    const selectedRule = this.conditionEvaluator.evaluateRules(actor.rules, context);
    const resolvedAction = this.resolveAction(actor, allies, enemies, turnNumber);

    return {
      context,
      ruleEvaluations,
      selectedRule,
      resolvedAction
    };
  }

  getAllPossibleTargets(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): Record<string, BattleParticipant | null> {
    const livingAllies = allies.filter(a => a.isAlive);
    const livingEnemies = enemies.filter(e => e.isAlive);

    const allTargets = TargetSelector.getAllValidTargets(actor, livingAllies, livingEnemies);

    const targets: Record<string, BattleParticipant | null> = {};

    Object.entries(allTargets).forEach(([targetType, result]) => {
      targets[targetType] = result.target;
    });

    return targets;
  }

  validateRulesConfiguration(rules: Rule[]): {
    valid: boolean;
    errors: Array<{ rule: Rule; error: string }>;
    warnings: Array<{ rule: Rule; warning: string }>;
  } {
    const errors: Array<{ rule: Rule; error: string }> = [];
    const warnings: Array<{ rule: Rule; warning: string }> = [];

    const priorities = new Map<number, Rule[]>();

    for (const rule of rules) {
      const conditionValidation = this.conditionEvaluator.validateConditionSyntax(rule.condition);
      if (!conditionValidation.valid) {
        errors.push({ rule, error: conditionValidation.error || 'Invalid condition' });
      }

      if (!priorities.has(rule.priority)) {
        priorities.set(rule.priority, []);
      }
      priorities.get(rule.priority)!.push(rule);
    }

    for (const [priority, rulesWithSamePriority] of priorities) {
      if (rulesWithSamePriority.length > 1) {
        for (const rule of rulesWithSamePriority) {
          warnings.push({
            rule,
            warning: `Multiple rules with same priority ${priority}. Execution order is not guaranteed.`
          });
        }
      }
    }

    const hasAlwaysRule = rules.some(rule => rule.condition.trim().toLowerCase() === 'always');
    if (!hasAlwaysRule) {
      warnings.push({
        rule: rules[0] || { priority: 0, condition: '', target: '', action: '' },
        warning: 'No fallback rule with condition "always". Actor might not act if no conditions match.'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}