import { BattleParticipant, Character, EnemyInstance, Action, BattleResult, Ability } from '../models/types';
import { ActionResolver, ResolvedAction } from './ActionResolver';
import { BattleLogger } from '../utils/BattleLogger';

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
  success: boolean;
  message: string;
  turnNumber: number;
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
  private battleState: BattleState | null = null;
  private logger?: BattleLogger | undefined;

  constructor(logger?: BattleLogger | undefined) {
    this.actionResolver = new ActionResolver();
    this.logger = logger;
  }

  initializeBattle(allies: Character[], enemies: EnemyInstance[]): BattleState {
    const allParticipants = [...allies, ...enemies];
    const turnOrder = this.calculateTurnOrder(allParticipants);

    this.battleState = {
      allies: [...allies],
      enemies: [...enemies],
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
    this.battleState.turnOrder = this.calculateTurnOrder(allParticipants);
    this.battleState.currentTurnIndex = 0;
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

      participant.buffs = participant.buffs.filter(buff => {
        buff.remainingTurns--;

        if (buff.remainingTurns <= 0) {
          this.removeBuff(participant, buff);
          return false;
        }

        return true;
      });
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

  executeTurn(): TurnResult | null {
    if (!this.battleState || this.battleState.isComplete) return null;

    const actor = this.getCurrentActor();
    if (!actor) return null;

    const allies = this.battleState.allies.filter(a => a.isAlive);
    const enemies = this.battleState.enemies.filter(e => e.isAlive);

    const actorAllies = actor.isEnemy ? enemies : allies;
    const actorEnemies = actor.isEnemy ? allies : enemies;

    const action = this.actionResolver.resolveAction(
      actor,
      actorAllies,
      actorEnemies,
      this.battleState.turnNumber
    );

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
    if (!target) {
      return {
        actor,
        action,
        success: false,
        message: `${actor.name} cannot find target for action`,
        turnNumber: this.battleState!.turnNumber
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
          turnNumber: this.battleState!.turnNumber
        };
      }

      if (actor.currentStats.mp < skill.mpCost) {
        return {
          actor,
          target,
          action,
          success: false,
          message: `${actor.name} not enough MP to cast ${skill.name} (need ${skill.mpCost}, have ${actor.currentStats.mp})`,
          turnNumber: this.battleState!.turnNumber
        };
      }

      return this.executeSkill(actor, target, skill, action);
    }

    return {
      actor,
      target,
      action,
      success: false,
      message: `${actor.name} unknown action type`,
      turnNumber: this.battleState!.turnNumber
    };
  }

  private executeBasicAttack(actor: BattleParticipant, target: BattleParticipant, action: ResolvedAction): TurnResult {
    const baseDamage = actor.currentStats.str;
    const defense = target.currentStats.def;
    const damage = Math.max(1, baseDamage - defense + Math.floor(Math.random() * 5));

    target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

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
      turnNumber: this.battleState!.turnNumber
    };
  }

  private executeSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    actor.currentStats.mp -= skill.mpCost;

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
          turnNumber: this.battleState!.turnNumber
        };
    }
  }

  private executeAttackSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    const baseDamage = skill.effect.damage || 0;
    const magicPower = actor.currentStats.mag;
    const defense = target.currentStats.def;

    const totalDamage = Math.max(1, baseDamage + magicPower - defense + Math.floor(Math.random() * 5));

    target.currentStats.hp = Math.max(0, target.currentStats.hp - totalDamage);

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
      turnNumber: this.battleState!.turnNumber
    };
  }

  private executeHealSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    const baseHeal = skill.effect.heal || 0;
    const magicPower = actor.currentStats.mag;

    const totalHeal = baseHeal + Math.floor(magicPower * 0.5) + Math.floor(Math.random() * 5);
    const actualHeal = Math.min(totalHeal, target.maxStats.hp - target.currentStats.hp);

    target.currentStats.hp += actualHeal;

    return {
      actor,
      target,
      action,
      heal: actualHeal,
      success: true,
      message: `${actor.name} casts ${skill.name} on ${target.name} healing ${actualHeal} HP (${target.currentStats.hp}/${target.maxStats.hp} HP)`,
      turnNumber: this.battleState!.turnNumber
    };
  }

  private executeBuffSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
    if (skill.effect.statModifier && skill.effect.duration) {
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
        }
      });
    }

    return {
      actor,
      target,
      action,
      success: true,
      message: `${actor.name} casts ${skill.name} on ${target.name} (buff applied for ${skill.effect.duration} turns)`,
      turnNumber: this.battleState!.turnNumber
    };
  }

  private executeDebuffSkill(actor: BattleParticipant, target: BattleParticipant, skill: Ability, action: ResolvedAction): TurnResult {
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
        }
      });
    }

    return {
      actor,
      target,
      action,
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

    return {
      victory: this.battleState.victor === 'allies',
      reason: this.battleState.victor === 'allies' ? 'All enemies defeated' : 'All allies defeated',
      turns: this.battleState.turnNumber,
      survivingAllies: this.battleState.allies.filter(a => a.isAlive),
      defeatedEnemies: this.battleState.enemies.filter(e => !e.isAlive)
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

  getParticipantStatus(): Array<{ participant: BattleParticipant; hpPercent: number; mpPercent: number; buffs: number }> {
    if (!this.battleState) return [];

    const allParticipants = [...this.battleState.allies, ...this.battleState.enemies];

    return allParticipants.map(participant => ({
      participant,
      hpPercent: Math.round((participant.currentStats.hp / participant.maxStats.hp) * 100),
      mpPercent: Math.round((participant.currentStats.mp / participant.maxStats.mp) * 100),
      buffs: participant.buffs.length
    }));
  }

  simulateFullBattle(maxTurns: number = 100): BattleResult {
    let turnCount = 0;

    while (!this.isBattleComplete() && turnCount < maxTurns) {
      this.executeTurn();
      turnCount++;
    }

    if (!this.isBattleComplete()) {
      this.battleState!.isComplete = true;
      this.battleState!.victor = null;

      return {
        victory: false,
        reason: `Battle timed out after ${maxTurns} turns`,
        turns: this.battleState!.turnNumber,
        survivingAllies: this.battleState!.allies.filter(a => a.isAlive),
        defeatedEnemies: this.battleState!.enemies.filter(e => !e.isAlive)
      };
    }

    return this.getBattleResult()!;
  }
}