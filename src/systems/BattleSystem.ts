import { BattleParticipant, Character, EnemyInstance, Action, BattleResult, Ability } from '../models/types';
import { ActionResolver, ResolvedAction } from './ActionResolver';
import { BattleLogger } from '../utils/BattleLogger';
import { BattleError, ValidationError, ErrorHandler } from '../utils/errors';
import { EnemyAI, EnemyDecision } from './EnemyAI';
import { LootSystem } from './LootSystem';

export interface TurnOrder {
  participant: BattleParticipant;
  speed: number;
  initiative: number;
}

export interface TurnResult {
  actor: BattleParticipant;
  target?: BattleParticipant;
  action: ResolvedAction;
  damage?: number;
  heal?: number;
  buffApplied?: {
    name: string;
    statModifier: Record<string, number>;
    duration: number;
  } | undefined;
  debuffApplied?: {
    name: string;
    statModifier: Record<string, number>;
    duration: number;
  } | undefined;
  success: boolean;
  message: string;
  turnNumber: number;
  beforeHp?: number;
  afterHp?: number;
}

export interface BattleState {
  allies: Character[];
  enemies: EnemyInstance[];
  turnNumber: number;
  turnOrder: TurnOrder[];
  currentTurnIndex: number;
  isComplete: boolean;
  victor: 'allies' | 'enemies' | null;
  history: TurnResult[];
}

export class BattleSystem {
  private actionResolver: ActionResolver;
  private enemyAI: EnemyAI;
  private lootSystem: LootSystem;
  private battleState: BattleState | null = null;
  private logger?: BattleLogger | undefined;
  private entityFactory?: any; // Para crear minions

  constructor(logger?: BattleLogger | undefined, entityFactory?: any) {
    this.actionResolver = new ActionResolver();
    this.enemyAI = new EnemyAI();
    this.lootSystem = new LootSystem();
    this.logger = logger;
    this.entityFactory = entityFactory;

    // Debug: Check if logger is properly initialized
    console.log('DEBUG: BattleSystem constructor called');
    console.log('DEBUG: Logger provided:', !!logger);
    console.log('DEBUG: EntityFactory provided:', !!entityFactory);

    if (this.logger) {
      this.logger.logDebug('BATTLE_SYSTEM', 'BattleSystem initialized with logger');
    }
  }

  initializeBattle(allies: Character[], enemies: EnemyInstance[]): BattleState {
    // Validar entrada
    if (!Array.isArray(allies) || !Array.isArray(enemies)) {
      throw new ValidationError('Allies and enemies must be arrays');
    }

    if (allies.length === 0) {
      throw new BattleError('Cannot start battle with no allies');
    }

    if (enemies.length === 0) {
      throw new BattleError('Cannot start battle with no enemies');
    }

    // Validar que los participantes estén vivos
    const livingAllies = allies.filter(a => a.isAlive);
    const livingEnemies = enemies.filter(e => e.isAlive);

    if (livingAllies.length === 0) {
      throw new BattleError('Cannot start battle - all allies are defeated');
    }

    if (livingEnemies.length === 0) {
      throw new BattleError('Cannot start battle - all enemies are defeated');
    }

    // Ensure all participants have skillCooldowns arrays initialized
    livingAllies.forEach(ally => {
      if (!ally.skillCooldowns) {
        ally.skillCooldowns = [];
      }
    });

    livingEnemies.forEach(enemy => {
      if (!enemy.skillCooldowns) {
        enemy.skillCooldowns = [];
      }
    });

    const allParticipants = [...livingAllies, ...livingEnemies];
    const turnOrder = this.calculateTurnOrder(allParticipants);

    this.battleState = {
      allies: [...livingAllies],
      enemies: [...livingEnemies],
      turnNumber: 1,
      turnOrder,
      currentTurnIndex: 0,
      isComplete: false,
      victor: null,
      history: []
    };

    return this.battleState;
  }

  private calculateTurnOrder(participants: BattleParticipant[]): TurnOrder[] {
    const livingParticipants = participants.filter(p => p.isAlive);

    const turnOrder = livingParticipants.map(participant => ({
      participant,
      speed: participant.currentStats.spd,
      initiative: participant.currentStats.spd + Math.floor(Math.random() * 10)
    }));

    return turnOrder.sort((a, b) => b.initiative - a.initiative);
  }

  private refreshTurnOrder(): void {
    if (!this.battleState) return;

    const allParticipants = [...this.battleState.allies, ...this.battleState.enemies];
    const previousTurnIndex = this.battleState.currentTurnIndex;
    const previousActor = this.battleState.turnOrder[previousTurnIndex]?.participant;

    this.battleState.turnOrder = this.calculateTurnOrder(allParticipants);

    // Find the new position of the previous actor to maintain turn continuity
    if (previousActor) {
      const newIndex = this.battleState.turnOrder.findIndex(turn => turn.participant.id === previousActor.id);
      if (newIndex !== -1) {
        this.battleState.currentTurnIndex = newIndex;
      } else {
        this.battleState.currentTurnIndex = 0;
      }
    } else {
      this.battleState.currentTurnIndex = 0;
    }
  }

  getCurrentActor(): BattleParticipant | null {
    if (!this.battleState || this.battleState.isComplete) return null;

    let attempts = 0;
    const maxAttempts = this.battleState.turnOrder.length * 2;

    while (attempts < maxAttempts) {
      const currentTurn = this.battleState.turnOrder[this.battleState.currentTurnIndex];

      if (currentTurn && currentTurn.participant.isAlive) {
        return currentTurn.participant;
      }

      this.advanceTurn();
      attempts++;
    }

    return null;
  }

  private advanceTurn(): void {
    if (!this.battleState) return;

    this.battleState.currentTurnIndex++;

    if (this.battleState.currentTurnIndex >= this.battleState.turnOrder.length) {
      this.battleState.turnNumber++;
      this.battleState.currentTurnIndex = 0;
      this.refreshTurnOrder();
      this.processTurnEffects();
    }
  }

  private processTurnEffects(): void {
    if (!this.battleState) return;

    const allParticipants = [...this.battleState.allies, ...this.battleState.enemies];

    for (const participant of allParticipants) {
      if (!participant.isAlive) continue;

      // Process buff effects
      participant.buffs = participant.buffs.filter(buff => {
        buff.remainingTurns--;

        if (buff.remainingTurns <= 0) {
          this.removeBuff(participant, buff);
          return false;
        }

        return true;
      });

      // Process skill cooldowns
      this.reduceSkillCooldowns(participant);
    }
  }

  private removeBuff(participant: BattleParticipant, buff: any): void {
    if (buff.statModifier) {
      Object.keys(buff.statModifier).forEach(stat => {
        const statKey = stat as keyof typeof participant.currentStats;
        if (typeof participant.currentStats[statKey] === 'number' && typeof buff.statModifier[statKey] === 'number') {
          (participant.currentStats[statKey] as number) -= buff.statModifier[statKey];

          if (statKey === 'hp') {
            participant.currentStats.hp = Math.max(0, Math.min(participant.currentStats.hp, participant.maxStats.hp));
          } else if (statKey === 'mp') {
            participant.currentStats.mp = Math.max(0, Math.min(participant.currentStats.mp, participant.maxStats.mp));
          }
        }
      });
    }
  }

  private reduceSkillCooldowns(participant: BattleParticipant): void {
    participant.skillCooldowns = participant.skillCooldowns.filter(cooldown => {
      cooldown.remainingTurns--;

      if (cooldown.remainingTurns <= 0) {
        return false; // Remove expired cooldowns
      }

      return true;
    });
  }

  private isSkillOnCooldown(participant: BattleParticipant, skillName: string): boolean {
    return participant.skillCooldowns.some(cooldown =>
      cooldown.skillName === skillName && cooldown.remainingTurns > 0
    );
  }

  private applySkillCooldown(participant: BattleParticipant, skill: Ability): void {
    if (skill.cooldown && skill.cooldown > 0) {
      const existingCooldown = participant.skillCooldowns.find(cooldown =>
        cooldown.skillName === skill.name
      );

      if (existingCooldown) {
        existingCooldown.remainingTurns = skill.cooldown;
      } else {
        participant.skillCooldowns.push({
          skillName: skill.name,
          remainingTurns: skill.cooldown
        });
      }
    }
  }

  private canUseSkillCombination(participant: BattleParticipant, skill: Ability): boolean {
    if (!skill.combinations || skill.combinations.length === 0) {
      return true; // No combinations required
    }

    // Check if participant has all required combination skills
    return skill.combinations.every(combinationSkillId => {
      return participant.abilities.some(ability =>
        ability.name.toLowerCase().replace(/\s+/g, '_') === combinationSkillId
      );
    });
  }

  private getSkillLevel(participant: BattleParticipant, skill: Ability): number {
    // For now, return the skill's level or 1 if not specified
    return skill.level || 1;
  }

  executeTurn(): TurnResult | null {
    if (!this.battleState) {
      throw new BattleError('Battle not initialized. Call initializeBattle() first.');
    }

    if (this.battleState.isComplete) {
      throw new BattleError('Battle is already complete');
    }

    const actor = this.getCurrentActor();
    if (!actor) {
      throw new BattleError('No valid actor found for current turn');
    }

    const allies = this.battleState.allies.filter(a => a.isAlive);
    const enemies = this.battleState.enemies.filter(e => e.isAlive);

    const actorAllies = actor.isEnemy ? enemies : allies;
    const actorEnemies = actor.isEnemy ? allies : enemies;

    let action: ResolvedAction | null = null;

    // Use EnemyAI for enemy actors that don't have custom rules
    if (actor.isEnemy && (!actor.rules || actor.rules.length === 0)) {
      const enemyDecision = this.enemyAI.makeDecision(
        actor as EnemyInstance,
        actorAllies,
        actorEnemies,
        this.battleState.turnNumber
      );

      // Convert EnemyDecision to ResolvedAction format
      action = this.convertEnemyDecisionToResolvedAction(enemyDecision, actor);
    } else {
      // Use traditional rule-based system for allies and enemies with custom rules
      action = this.actionResolver.resolveAction(
        actor,
        actorAllies,
        actorEnemies,
        this.battleState.turnNumber
      );
    }

    if (!action) {
      const skipResult: TurnResult = {
        actor,
        action: {
          rule: { priority: 0, condition: 'skip', target: 'self', action: 'skip' },
          actionType: 'attack',
          priority: 0,
          success: false,
          message: `${actor.name} skips turn (no valid action)`
        },
        success: false,
        message: `${actor.name} skips turn`,
        turnNumber: this.battleState.turnNumber
      };

      this.battleState.history.push(skipResult);
      this.advanceTurn();
      return skipResult;
    }

    const target = this.findTargetById(action.targetId);
    const result = this.executeAction(actor, target, action);

    this.battleState.history.push(result);

    // Log the turn if logger is available
    if (this.logger) {
      this.logger.logTurn(result);
    }

    this.checkBattleEnd();

    this.advanceTurn();

    return result;
  }

  private findTargetById(targetId?: string): BattleParticipant | null {
    if (!targetId || !this.battleState) return null;

    const allParticipants = [...this.battleState.allies, ...this.battleState.enemies];
    return allParticipants.find(p => p.id === targetId) || null;
  }

  private executeAction(actor: BattleParticipant, target: BattleParticipant | null, action: ResolvedAction): TurnResult {
    if (!this.battleState) {
      throw new BattleError('Battle state not initialized');
    }

    if (!target) {
      return {
        actor,
        action,
        success: false,
        message: `${actor.name} cannot find target for action`,
        turnNumber: this.battleState.turnNumber
      };
    }

    if (!target.isAlive) {
      return {
        actor,
        target,
        action,
        success: false,
        message: `${actor.name} cannot target defeated ${target.name}`,
        turnNumber: this.battleState.turnNumber
      };
    }

    if (action.actionType === 'attack') {
      return this.executeBasicAttack(actor, target, action);
    } else if (action.actionType === 'cast' && action.skillId) {
      const skill = actor.abilities.find(a =>
        a.name.toLowerCase().replace(/\s+/g, '_') === action.skillId
      );

      if (!skill) {
        return {
          actor,
          target,
          action,
          success: false,
          message: `${actor.name} does not know skill: ${action.skillId}`,
          turnNumber: this.battleState.turnNumber
        };
      }

      if (actor.currentStats.mp < skill.mpCost) {
        return {
          actor,
          target,
          action,
          success: false,
          message: `${actor.name} not enough MP to cast ${skill.name} (need ${skill.mpCost}, have ${actor.currentStats.mp})`,
          turnNumber: this.battleState.turnNumber
        };
      }

      return this.executeSkill(actor, target, skill, action);
    }

    return {
      actor,
      target,
      action,
      success: false,
      message: `${actor.name} unknown action type: ${action.actionType}`,
      turnNumber: this.battleState.turnNumber
    };
  }

  private executeBasicAttack(actor: BattleParticipant, target: BattleParticipant, action: ResolvedAction): TurnResult {
    const baseDamage = actor.currentStats.str;
    const defense = target.currentStats.def;
    const damage = Math.max(1, baseDamage - defense + Math.floor(Math.random() * 5));

    const beforeHp = target.currentStats.hp;
    target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);
    const afterHp = target.currentStats.hp;

    if (target.currentStats.hp <= 0) {
      target.isAlive = false;
    }

    return {
      actor,
      target,
      action,
      damage,
      success: true,
      message: `${actor.name} attacks ${target.name} for ${damage} damage (${target.currentStats.hp}/${target.maxStats.hp} HP remaining)`,
      turnNumber: this.battleState!.turnNumber,
      beforeHp,
      afterHp
    };
  }

  private executeSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    if (!this.battleState) {
      throw new BattleError('Battle state not initialized');
    }

    // Check if skill is on cooldown
    if (this.isSkillOnCooldown(actor, skill.name)) {
      const cooldown = actor.skillCooldowns.find(c => c.skillName === skill.name);
      return {
        actor,
        target,
        action,
        success: false,
        message: `${actor.name} cannot use ${skill.name} - on cooldown for ${cooldown?.remainingTurns} more turns`,
        turnNumber: this.battleState.turnNumber
      };
    }

    // Check if skill combinations are available
    if (!this.canUseSkillCombination(actor, skill)) {
      return {
        actor,
        target,
        action,
        success: false,
        message: `${actor.name} cannot use ${skill.name} - missing required combination skills`,
        turnNumber: this.battleState.turnNumber
      };
    }

    // Validar que el actor tenga suficiente MP
    if (actor.currentStats.mp < skill.mpCost) {
      return {
        actor,
        target,
        action,
        success: false,
        message: `${actor.name} not enough MP to cast ${skill.name} (need ${skill.mpCost}, have ${actor.currentStats.mp})`,
        turnNumber: this.battleState.turnNumber
      };
    }

    // Consumir MP
    actor.currentStats.mp -= skill.mpCost;

    // Apply cooldown
    this.applySkillCooldown(actor, skill);

    switch (skill.type) {
      case 'attack':
        return this.executeAttackSkill(actor, target, skill, action);
      case 'heal':
        return this.executeHealSkill(actor, target, skill, action);
      case 'buff':
        return this.executeBuffSkill(actor, target, skill, action);
      case 'debuff':
        return this.executeDebuffSkill(actor, target, skill, action);
      default:
        return {
          actor,
          target,
          action,
          success: false,
          message: `${actor.name} unknown skill type: ${skill.type}`,
          turnNumber: this.battleState.turnNumber
        };
    }
  }

  private executeAttackSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    const baseDamage = skill.effect.damage || 0;
    const magicPower = actor.currentStats.mag;
    const defense = target.currentStats.def;

    const totalDamage = Math.max(1, baseDamage + magicPower - defense + Math.floor(Math.random() * 5));

    const beforeHp = target.currentStats.hp;
    target.currentStats.hp = Math.max(0, target.currentStats.hp - totalDamage);
    const afterHp = target.currentStats.hp;

    if (target.currentStats.hp <= 0) {
      target.isAlive = false;
    }

    return {
      actor,
      target,
      action,
      damage: totalDamage,
      success: true,
      message: `${actor.name} casts ${skill.name} on ${target.name} for ${totalDamage} damage (${target.currentStats.hp}/${target.maxStats.hp} HP remaining)`,
      turnNumber: this.battleState!.turnNumber,
      beforeHp,
      afterHp
    };
  }

  private executeHealSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    const baseHeal = skill.effect.heal || 0;
    const magicPower = actor.currentStats.mag;

    const totalHeal = baseHeal + Math.floor(magicPower * 0.5) + Math.floor(Math.random() * 5);
    const actualHeal = Math.min(totalHeal, target.maxStats.hp - target.currentStats.hp);

    const beforeHp = target.currentStats.hp;
    target.currentStats.hp += actualHeal;
    const afterHp = target.currentStats.hp;

    return {
      actor,
      target,
      action,
      heal: actualHeal,
      success: true,
      message: `${actor.name} casts ${skill.name} on ${target.name} healing ${actualHeal} HP (${target.currentStats.hp}/${target.maxStats.hp} HP)`,
      turnNumber: this.battleState!.turnNumber,
      beforeHp,
      afterHp
    };
  }

  private executeBuffSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    // Handle summon effects - return the summon result directly
    if ((skill.effect as any).summon && this.entityFactory) {
      return this.executeSummonSkill(actor, skill, action);
    }

    // Skip buff processing for summon skills
    if ((skill.effect as any).summon) {
      return {
        actor,
        target,
        action,
        success: true,
        message: `${actor.name} casts ${skill.name} on ${target.name}`,
        turnNumber: this.battleState!.turnNumber
      };
    }

    let buffApplied: { name: string; statModifier: Record<string, number>; duration: number } | undefined;

    if (skill.effect.statModifier && skill.effect.duration && skill.effect.duration > 0) {
      const buff = {
        name: skill.name,
        type: 'buff' as const,
        statModifier: skill.effect.statModifier,
        duration: skill.effect.duration,
        remainingTurns: skill.effect.duration
      };

      target.buffs.push(buff);

      Object.keys(skill.effect.statModifier).forEach(stat => {
        const statKey = stat as keyof typeof target.currentStats;
        if (typeof target.currentStats[statKey] === 'number' && typeof skill.effect.statModifier![statKey] === 'number') {
          (target.currentStats[statKey] as number) += skill.effect.statModifier![statKey]!;
          
          // Ensure stats don't go below 0
          if ((target.currentStats[statKey] as number) < 0) {
            (target.currentStats[statKey] as number) = 0;
          }
          
          // Check if target died from stat modification
          if (statKey === 'hp' && target.currentStats.hp <= 0 && target.isAlive) {
            target.isAlive = false;
          }
        }
      });

      buffApplied = {
        name: skill.name,
        statModifier: skill.effect.statModifier as Record<string, number>,
        duration: skill.effect.duration
      };
    }

    return {
      actor,
      target,
      action,
      buffApplied,
      success: true,
      message: `${actor.name} casts ${skill.name} on ${target.name}${buffApplied ? ` (buff applied for ${buffApplied.duration} turns)` : ''}`,
      turnNumber: this.battleState!.turnNumber
    };
  }

  private executeSummonSkill(actor: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    if (!this.battleState || !this.entityFactory) {
      return {
        actor,
        target: actor, // Use actor as target for summons
        action,
        success: false,
        message: `${actor.name} cannot summon - battle state or entity factory not available`,
        turnNumber: this.battleState?.turnNumber || 0
      };
    }

    const summonType = (skill.effect as any).summon;
    const summonCount = (skill.effect as any).count || 1;

    if (!summonType) {
      return {
        actor,
        target: actor, // Use actor as target for summons
        action,
        success: false,
        message: `${actor.name} cannot summon - invalid summon type`,
        turnNumber: this.battleState.turnNumber
      };
    }

    const summonedMinions: any[] = [];

    for (let i = 0; i < summonCount; i++) {
      try {
        const minion = this.entityFactory.createEnemy(summonType, `${summonType} ${i + 1}`, 1);
        summonedMinions.push(minion);

        // Add minion to the appropriate side (same as summoner)
        if (actor.isEnemy) {
          this.battleState.enemies.push(minion);
        } else {
          this.battleState.allies.push(minion);
        }
      } catch (error) {
        console.warn(`Failed to summon ${summonType}:`, error);
      }
    }

    console.log('DEBUG: Before refreshTurnOrder');
    console.log('DEBUG: Enemies count:', this.battleState.enemies.length);
    console.log('DEBUG: Enemies:', this.battleState.enemies.map(e => ({ name: e.name, isAlive: e.isAlive, spd: e.currentStats.spd })));

    // Refresh turn order to include new minions
    this.refreshTurnOrder();

    console.log('DEBUG: After refreshTurnOrder');
    console.log('DEBUG: Turn order length:', this.battleState.turnOrder.length);
    console.log('DEBUG: Turn order:', this.battleState.turnOrder.map(t => ({ name: t.participant.name, isAlive: t.participant.isAlive, spd: t.speed })));

    const minionNames = summonedMinions.map(m => m.name).join(', ');

    const message = `${actor.name} summons ${minionNames} to join the battle!`;
    console.log('DEBUG: Summon message generated:', JSON.stringify(message));

    // Also log through the system's logger if available
    if (this.logger) {
      this.logger.logDebug('SUMMON', `Summoned minions: ${minionNames}`);
      this.logger.logDebug('SUMMON', `Enemies after summon: ${this.battleState.enemies.map(e => e.name).join(', ')}`);
      this.logger.logDebug('SUMMON', `Turn order after summon: ${this.battleState.turnOrder.map(t => t.participant.name).join(', ')}`);
      this.logger.logTurn({
        actor,
        target: actor,
        action,
        success: true,
        message: `DEBUG: Summoned minions: ${minionNames}`,
        turnNumber: this.battleState.turnNumber
      });
    }

    return {
      actor,
      target: actor, // Use actor as target for summons
      action,
      success: true,
      message,
      turnNumber: this.battleState.turnNumber
    };
  }

  private executeDebuffSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    let debuffApplied: { name: string; statModifier: Record<string, number>; duration: number } | undefined;

    if (skill.effect.statModifier && skill.effect.duration) {
      const debuff = {
        name: skill.name,
        type: 'debuff' as const,
        statModifier: skill.effect.statModifier,
        duration: skill.effect.duration,
        remainingTurns: skill.effect.duration
      };

      target.buffs.push(debuff);

      Object.keys(skill.effect.statModifier).forEach(stat => {
        const statKey = stat as keyof typeof target.currentStats;
        if (typeof target.currentStats[statKey] === 'number' && typeof skill.effect.statModifier![statKey] === 'number') {
          (target.currentStats[statKey] as number) += skill.effect.statModifier![statKey]!;
          
          // Ensure stats don't go below 0
          if ((target.currentStats[statKey] as number) < 0) {
            (target.currentStats[statKey] as number) = 0;
          }
          
          // Check if target died from stat modification
          if (statKey === 'hp' && target.currentStats.hp <= 0 && target.isAlive) {
            target.isAlive = false;
          }
        }
      });

      debuffApplied = {
        name: skill.name,
        statModifier: skill.effect.statModifier as Record<string, number>,
        duration: skill.effect.duration
      };
    }

    return {
      actor,
      target,
      action,
      debuffApplied,
      success: true,
      message: `${actor.name} casts ${skill.name} on ${target.name} (debuff applied for ${skill.effect.duration} turns)`,
      turnNumber: this.battleState!.turnNumber
    };
  }

  private checkBattleEnd(): void {
    if (!this.battleState) return;

    const livingAllies = this.battleState.allies.filter(a => a.isAlive);
    const livingEnemies = this.battleState.enemies.filter(e => e.isAlive);

    if (livingAllies.length === 0) {
      this.battleState.isComplete = true;
      this.battleState.victor = 'enemies';
    } else if (livingEnemies.length === 0) {
      this.battleState.isComplete = true;
      this.battleState.victor = 'allies';
    }
  }

  isBattleComplete(): boolean {
    return this.battleState?.isComplete || false;
  }

  getBattleResult(): BattleResult | null {
    if (!this.battleState || !this.battleState.isComplete) return null;

    const defeatedEnemies = this.battleState.enemies.filter(e => !e.isAlive);
    const battleLoot = this.lootSystem.generateBattleLoot(defeatedEnemies);

    return {
      victory: this.battleState.victor === 'allies',
      reason: this.battleState.victor === 'allies' ? 'All enemies defeated' : 'All allies defeated',
      turns: this.battleState.turnNumber,
      survivingAllies: this.battleState.allies.filter(a => a.isAlive),
      defeatedEnemies: defeatedEnemies,
      loot: {
        totalGold: battleLoot.totalGold,
        totalExperience: battleLoot.totalExperience,
        items: battleLoot.allItems
      }
    };
  }

  getBattleState(): BattleState | null {
    return this.battleState;
  }

  getTurnHistory(): TurnResult[] {
    return this.battleState?.history || [];
  }

  getTurnOrder(): TurnOrder[] {
    return this.battleState?.turnOrder || [];
  }

  getCurrentTurn(): number {
    return this.battleState?.turnNumber || 0;
  }

  getParticipantStatus(): Array<{ participant: BattleParticipant; hpPercent: number; mpPercent: number; buffs: number; activeCooldowns: number }> {
    if (!this.battleState) return [];

    const allParticipants = [...this.battleState.allies, ...this.battleState.enemies];

    return allParticipants.map(participant => ({
      participant,
      hpPercent: Math.round((participant.currentStats.hp / participant.maxStats.hp) * 100),
      mpPercent: Math.round((participant.currentStats.mp / participant.maxStats.mp) * 100),
      buffs: participant.buffs.length,
      activeCooldowns: participant.skillCooldowns.filter(cooldown => cooldown.remainingTurns > 0).length
    }));
  }

  simulateFullBattle(maxTurns: number = 100): BattleResult {
    if (!this.battleState) {
      throw new BattleError('Battle not initialized. Call initializeBattle() first.');
    }

    if (this.battleState.isComplete) {
      throw new BattleError('Battle is already complete');
    }

    if (maxTurns <= 0) {
      throw new ValidationError('maxTurns must be a positive number');
    }

    let turnCount = 0;

    try {
      while (!this.isBattleComplete() && turnCount < maxTurns) {
        this.executeTurn();
        turnCount++;
      }
    } catch (error) {
      // Si hay un error durante la simulación, marcar como timeout
      const err = error instanceof Error ? error : new Error(String(error));
      this.battleState.isComplete = true;
      this.battleState.victor = null;

      return {
        victory: false,
        reason: `Battle simulation failed: ${ErrorHandler.getUserFriendlyMessage(err)}`,
        turns: this.battleState.turnNumber,
        survivingAllies: this.battleState.allies.filter(a => a.isAlive),
        defeatedEnemies: this.battleState.enemies.filter(e => !e.isAlive),
        loot: {
          totalGold: 0,
          totalExperience: 0,
          items: []
        }
      };
    }

    if (!this.isBattleComplete()) {
      this.battleState.isComplete = true;
      this.battleState.victor = null;

      return {
        victory: false,
        reason: `Battle timed out after ${maxTurns} turns`,
        turns: this.battleState.turnNumber,
        survivingAllies: this.battleState.allies.filter(a => a.isAlive),
        defeatedEnemies: this.battleState.enemies.filter(e => !e.isAlive),
        loot: {
          totalGold: 0,
          totalExperience: 0,
          items: []
        }
      };
    }

    return this.getBattleResult()!;
  }

  private convertEnemyDecisionToResolvedAction(
    decision: EnemyDecision,
    actor: BattleParticipant
  ): ResolvedAction {
    const rule = {
      priority: decision.priority,
      condition: 'enemy_ai',
      target: decision.targetId ? 'specific' : 'randomEnemy',
      action: decision.action === 'cast' && decision.skillId
        ? `cast:${decision.skillId}`
        : 'attack'
    };

    return {
      rule,
      actionType: decision.action === 'cast' ? 'cast' : 'attack',
      skillId: decision.skillId,
      targetId: decision.targetId,
      targetName: decision.targetName,
      priority: decision.priority,
      success: true,
      message: decision.reasoning
    };
  }
}