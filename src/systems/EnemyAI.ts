import { BattleParticipant, EnemyInstance, Rule, Ability } from '../models/types';
import { ConditionEvaluator, ConditionContext } from './ConditionEvaluator';
import { TargetSelector, TargetType } from './TargetSelector';

export type EnemyBehaviorType =
  | 'aggressive'      // Prioriza ataques de alto daño
  | 'defensive'       // Prioriza buffs y curación propia
  | 'healing'         // Prioriza curación de aliados
  | 'support'         // Prioriza buffs para aliados
  | 'summoning'       // Prioriza invocación de refuerzos
  | 'boss'            // Comportamiento especial para jefes
  | 'adaptive';       // Se adapta basado en la composición del grupo

export interface EnemyBehaviorPattern {
  type: EnemyBehaviorType;
  priority: number;
  conditions: string[];
  preferredTargets: TargetType[];
  preferredActions: string[];
  adaptiveRules?: AdaptiveRule[];
}

export interface AdaptiveRule {
  condition: string;
  behaviorModifier: Partial<EnemyBehaviorPattern>;
}

export interface EnemyDecision {
  action: 'attack' | 'cast' | 'defend';
  skillId?: string | undefined;
  targetId?: string | undefined;
  targetName?: string | undefined;
  priority: number;
  reasoning: string;
}

export class EnemyAI {
  private conditionEvaluator: ConditionEvaluator;
  private behaviorPatterns: Map<string, EnemyBehaviorPattern[]>;

  constructor() {
    this.conditionEvaluator = new ConditionEvaluator();
    this.behaviorPatterns = new Map();
    this.initializeDefaultPatterns();
  }

  private initializeDefaultPatterns(): void {
    // Aggressive pattern - focus on dealing damage
    this.behaviorPatterns.set('aggressive', [
      {
        type: 'aggressive',
        priority: 100,
        conditions: ['enemy.count > 0'],
        preferredTargets: ['weakestEnemy', 'lowestHpAlly'],
        preferredActions: ['attack', 'cast:high_damage_skill'],
        adaptiveRules: [
          {
            condition: 'self.hp < 30%',
            behaviorModifier: {
              preferredTargets: ['self'],
              preferredActions: ['cast:defensive_skill']
            }
          }
        ]
      }
    ]);

    // Defensive pattern - focus on self-preservation
    this.behaviorPatterns.set('defensive', [
      {
        type: 'defensive',
        priority: 90,
        conditions: ['self.hp < 50%'],
        preferredTargets: ['self'],
        preferredActions: ['cast:defensive_buff', 'cast:healing_skill'],
        adaptiveRules: [
          {
            condition: 'ally.hp < 20%',
            behaviorModifier: {
              preferredTargets: ['lowestHpAlly'],
              preferredActions: ['cast:healing_skill']
            }
          }
        ]
      }
    ]);

    // Healing pattern - focus on supporting allies
    this.behaviorPatterns.set('healing', [
      {
        type: 'healing',
        priority: 85,
        conditions: ['ally.hp < 50%'],
        preferredTargets: ['lowestHpAlly'],
        preferredActions: ['cast:healing_skill', 'cast:regeneration_buff']
      }
    ]);

    // Support pattern - focus on buffing allies
    this.behaviorPatterns.set('support', [
      {
        type: 'support',
        priority: 80,
        conditions: ['always'],
        preferredTargets: ['randomAlly'],
        preferredActions: ['cast:attack_buff', 'cast:defense_buff']
      }
    ]);

    // Boss pattern - complex multi-phase behavior
    this.behaviorPatterns.set('boss', [
      {
        type: 'boss',
        priority: 120,
        conditions: ['self.hp > 70%'],
        preferredTargets: ['strongestEnemy'],
        preferredActions: ['cast:boss_special_attack', 'cast:aoe_damage'],
        adaptiveRules: [
          {
            condition: 'self.hp < 30%',
            behaviorModifier: {
              preferredTargets: ['self'],
              preferredActions: ['cast:ultimate_skill', 'cast:emergency_heal']
            }
          },
          {
            condition: 'enemy.count > 3',
            behaviorModifier: {
              preferredActions: ['cast:aoe_damage', 'cast:debuff_all']
            }
          }
        ]
      }
    ]);

    // Adaptive pattern - changes based on party composition
    this.behaviorPatterns.set('adaptive', [
      {
        type: 'adaptive',
        priority: 95,
        conditions: ['always'],
        preferredTargets: ['randomEnemy'],
        preferredActions: ['attack'],
        adaptiveRules: [
          {
            condition: 'party.hasHealer',
            behaviorModifier: {
              preferredTargets: ['lowestHpAlly'],
              preferredActions: ['cast:anti_heal_debuff']
            }
          },
          {
            condition: 'party.hasTank',
            behaviorModifier: {
              preferredTargets: ['strongestEnemy'],
              preferredActions: ['cast:armor_break']
            }
          },
          {
            condition: 'party.hasDps',
            behaviorModifier: {
              preferredTargets: ['weakestEnemy'],
              preferredActions: ['cast:damage_skill']
            }
          }
        ]
      }
    ]);
  }

  makeDecision(
    enemy: EnemyInstance,
    allies: BattleParticipant[],
    enemies: BattleParticipant[],
    turnNumber: number
  ): EnemyDecision {
    const context = this.conditionEvaluator.createTestContext(enemy, allies, enemies, turnNumber);
    const behaviorType = this.determineBehaviorType(enemy);
    const patterns = this.behaviorPatterns.get(behaviorType) || [];

    // Evaluate adaptive rules first
    const adaptiveModifiers = this.evaluateAdaptiveRules(patterns, context);

    // Find the best pattern that matches current conditions
    const bestPattern = this.selectBestPattern(patterns, context, adaptiveModifiers);

    if (!bestPattern) {
      // Fallback to basic attack
      return this.createFallbackDecision(enemy, allies, enemies, 'No suitable behavior pattern found');
    }

    // Select target based on pattern preferences
    const target = this.selectTargetFromPattern(bestPattern, context);

    if (!target) {
      return this.createFallbackDecision(enemy, allies, enemies, 'No valid target found');
    }

    // Select action based on pattern preferences
    const action = this.selectActionFromPattern(bestPattern, enemy, target);

    return {
      action: action.type,
      skillId: action.skillId || undefined,
      targetId: target.id,
      targetName: target.name,
      priority: bestPattern.priority,
      reasoning: `Using ${behaviorType} behavior: ${bestPattern.type} pattern`
    };
  }

  private determineBehaviorType(enemy: EnemyInstance): string {
    // Determine behavior based on enemy type and job
    if (enemy.isBoss) {
      return 'boss';
    }

    // Check for special behavior indicators in enemy type or job
    const type = enemy.type.toLowerCase();
    const job = enemy.job.toLowerCase();

    if (type.includes('healer') || type.includes('cleric') || job.includes('healer') || job.includes('cleric')) {
      return 'healing';
    }
    if (type.includes('mage') || type.includes('wizard') || job.includes('mage') || job.includes('wizard')) {
      return 'support';
    }
    if (type.includes('warrior') || type.includes('fighter') || job.includes('warrior') || job.includes('fighter')) {
      return 'aggressive';
    }
    if (type.includes('tank') || type.includes('guardian') || job.includes('tank') || job.includes('guardian')) {
      return 'defensive';
    }

    // Default to adaptive behavior for unknown types
    return 'adaptive';
  }

  private evaluateAdaptiveRules(
    patterns: EnemyBehaviorPattern[],
    context: ConditionContext
  ): Map<string, Partial<EnemyBehaviorPattern>> {
    const modifiers = new Map<string, Partial<EnemyBehaviorPattern>>();

    for (const pattern of patterns) {
      if (pattern.adaptiveRules) {
        for (const adaptiveRule of pattern.adaptiveRules) {
          try {
            const conditionMet = this.conditionEvaluator.evaluateCondition(
              adaptiveRule.condition,
              context
            );

            if (conditionMet) {
              modifiers.set(pattern.type, adaptiveRule.behaviorModifier);
            }
          } catch (error) {
            console.warn(`Error evaluating adaptive rule condition: ${adaptiveRule.condition}`, error);
          }
        }
      }
    }

    return modifiers;
  }

  private selectBestPattern(
    patterns: EnemyBehaviorPattern[],
    context: ConditionContext,
    modifiers: Map<string, Partial<EnemyBehaviorPattern>>
  ): EnemyBehaviorPattern | null {
    let bestPattern: EnemyBehaviorPattern | null = null;
    let bestScore = -1;

    for (const pattern of patterns) {
      let score = pattern.priority;

      // Check if any conditions are met
      const conditionsMet = pattern.conditions.some(condition => {
        try {
          return this.conditionEvaluator.evaluateCondition(condition, context);
        } catch (error) {
          console.warn(`Error evaluating pattern condition: ${condition}`, error);
          return false;
        }
      });

      if (!conditionsMet) {
        continue;
      }

      // Apply adaptive modifiers
      const modifier = modifiers.get(pattern.type);
      if (modifier) {
        if (modifier.priority) {
          score += modifier.priority;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestPattern = { ...pattern };

        // Apply modifier if exists
        if (modifier) {
          Object.assign(bestPattern, modifier);
        }
      }
    }

    return bestPattern;
  }

  private selectTargetFromPattern(
    pattern: EnemyBehaviorPattern,
    context: ConditionContext
  ): BattleParticipant | null {
    for (const targetType of pattern.preferredTargets) {
      try {
        const result = TargetSelector.selectTarget(
          targetType,
          context.actor,
          context.livingAllies,
          context.livingEnemies
        );

        if (result.target && result.target.isAlive) {
          return result.target;
        }
      } catch (error) {
        console.warn(`Error selecting target ${targetType}:`, error);
      }
    }

    // Fallback to random enemy
    const result = TargetSelector.selectTarget(
      'randomEnemy',
      context.actor,
      context.livingAllies,
      context.livingEnemies
    );

    return result.target;
  }

  private selectActionFromPattern(
    pattern: EnemyBehaviorPattern,
    enemy: EnemyInstance,
    target: BattleParticipant
  ): { type: 'attack' | 'cast'; skillId?: string } {
    for (const action of pattern.preferredActions) {
      if (action === 'attack') {
        return { type: 'attack' };
      }

      const castMatch = action.match(/^cast:(.+)$/);
      if (castMatch && castMatch[1]) {
        const skillId = castMatch[1];

        // Check if enemy has this skill
        const hasSkill = enemy.abilities.some(ability =>
          ability.name.toLowerCase().replace(/\s+/g, '_') === skillId
        );

        if (hasSkill) {
          // Check if skill is available (not on cooldown, enough MP)
          const skill = enemy.abilities.find(ability =>
            ability.name.toLowerCase().replace(/\s+/g, '_') === skillId
          );

          if (skill) {
            const isOnCooldown = enemy.skillCooldowns.some(cooldown =>
              cooldown.skillName === skill.name && cooldown.remainingTurns > 0
            );

            const hasEnoughMp = enemy.currentStats.mp >= skill.mpCost;

            if (!isOnCooldown && hasEnoughMp) {
              return { type: 'cast', skillId };
            }
          }
        }
      }
    }

    // Fallback to basic attack
    return { type: 'attack' };
  }

  private createFallbackDecision(
    enemy: EnemyInstance,
    allies: BattleParticipant[],
    enemies: BattleParticipant[],
    reason: string
  ): EnemyDecision {
    // Find a random living enemy as fallback target
    const livingEnemies = enemies.filter(e => e.isAlive);
    const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];

    return {
      action: 'attack',
      skillId: undefined,
      targetId: target?.id || '',
      targetName: target?.name || '',
      priority: 0,
      reasoning: `Fallback decision: ${reason}`
    };
  }

  // Method to analyze party composition for adaptive behavior
  analyzePartyComposition(enemies: BattleParticipant[]): {
    hasHealer: boolean;
    hasTank: boolean;
    hasDps: boolean;
    healer?: BattleParticipant | undefined;
    tank?: BattleParticipant | undefined;
    dpsList: BattleParticipant[];
  } {
    const result = {
      hasHealer: false,
      hasTank: false,
      hasDps: false,
      healer: undefined as BattleParticipant | undefined,
      tank: undefined as BattleParticipant | undefined,
      dpsList: [] as BattleParticipant[]
    };

    for (const enemy of enemies) {
      // BattleParticipant doesn't have job, so we'll use a different approach
      // For now, we'll assume all enemies are potential DPS unless they have healing abilities
      const hasHealingAbilities = enemy.abilities.some(ability =>
        ability.type === 'heal' || ability.name.toLowerCase().includes('heal')
      );

      if (hasHealingAbilities) {
        result.hasHealer = true;
        result.healer = enemy;
      } else if (enemy.currentStats.def > enemy.currentStats.str) {
        // Assume tank if defense is higher than strength
        result.hasTank = true;
        result.tank = enemy;
      } else {
        result.hasDps = true;
        result.dpsList.push(enemy);
      }
    }

    return result;
  }

  // Method to get behavior patterns for a specific enemy type
  getBehaviorPatterns(enemyType: string): EnemyBehaviorPattern[] {
    return this.behaviorPatterns.get(enemyType) || [];
  }

  // Method to add custom behavior patterns
  addBehaviorPattern(enemyType: string, pattern: EnemyBehaviorPattern): void {
    if (!this.behaviorPatterns.has(enemyType)) {
      this.behaviorPatterns.set(enemyType, []);
    }

    this.behaviorPatterns.get(enemyType)!.push(pattern);
  }

  // Method to override default patterns
  setBehaviorPatterns(enemyType: string, patterns: EnemyBehaviorPattern[]): void {
    this.behaviorPatterns.set(enemyType, patterns);
  }
}