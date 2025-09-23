import * as fs from 'fs';
import * as path from 'path';
import {
  CombatAnimationData,
  CombatMetadata,
  CombatInitialState,
  CombatTurn,
  CombatFinalState,
  CombatParticipant,
  CombatAction,
  CombatStateChange,
  BattleParticipant,
  BattleResult
} from '../models/types';
import { TurnResult } from '../systems/BattleSystem';

export class CombatDataExporter {
  private outputDir: string;

  constructor(outputDir: string = './combat-animations') {
    this.outputDir = outputDir;
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  exportCombatData(
    dungeonId: number,
    dungeonName: string,
    battleId: number,
    battleOrder: number,
    maxTurns: number,
    initialParty: BattleParticipant[],
    initialEnemies: BattleParticipant[],
    finalParty: BattleParticipant[],
    finalEnemies: BattleParticipant[],
    turnHistory: TurnResult[],
    battleResult: BattleResult,
    startTime: Date,
    endTime: Date
  ): string {
    const metadata: CombatMetadata = {
      dungeonId,
      dungeonName,
      battleId,
      battleOrder,
      timestamp: startTime.toISOString(),
      duration: endTime.getTime() - startTime.getTime(),
      victory: battleResult.victory,
      totalTurns: battleResult.turns,
      maxTurns
    };

    const initialState: CombatInitialState = {
      party: initialParty.map(p => this.convertParticipant(p)),
      enemies: initialEnemies.map(e => this.convertParticipant(e)),
      turnOrder: this.extractTurnOrder(turnHistory)
    };

    const turns: CombatTurn[] = turnHistory.map((turn, index) =>
      this.convertTurn(turn, index + 1, startTime.getTime())
    );

    const finalState: CombatFinalState = {
      party: finalParty.map(p => this.convertParticipant(p)),
      enemies: finalEnemies.map(e => this.convertParticipant(e)),
      victory: battleResult.victory,
      reason: battleResult.reason,
      survivors: battleResult.survivingAllies.map(a => a.id),
      defeated: battleResult.defeatedEnemies.map(e => e.id)
    };

    const animationData: CombatAnimationData = {
      metadata,
      initialState,
      turns,
      finalState
    };

    const filename = this.generateFilename(dungeonId, battleId, startTime);
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(animationData, null, 2), 'utf-8');

    return filepath;
  }

  private convertParticipant(participant: BattleParticipant): CombatParticipant {
    return {
      id: participant.id,
      name: participant.name,
      job: (participant as any).job || 'Unknown',
      level: (participant as any).level || 1,
      isEnemy: participant.isEnemy,
      isBoss: participant.isBoss || false,
      stats: {
        hp: participant.currentStats.hp,
        maxHp: participant.maxStats.hp,
        mp: participant.currentStats.mp,
        maxMp: participant.maxStats.mp,
        str: participant.currentStats.str,
        def: participant.currentStats.def,
        mag: participant.currentStats.mag,
        spd: participant.currentStats.spd
      },
      abilities: participant.abilities.map(a => (a as any).id || a.name),
      buffs: participant.buffs.map(buff => ({
        name: buff.name,
        type: buff.type,
        duration: buff.duration,
        remainingTurns: buff.remainingTurns,
        statModifier: buff.statModifier
      }))
    };
  }

  private extractTurnOrder(turnHistory: TurnResult[]): string[] {
    if (turnHistory.length === 0) return [];

    // Extract unique participant IDs in the order they appear
    const turnOrder: string[] = [];
    const seen = new Set<string>();

    for (const turn of turnHistory) {
      if (!seen.has(turn.actor.id)) {
        seen.add(turn.actor.id);
        turnOrder.push(turn.actor.id);
      }
    }

    return turnOrder;
  }

  private convertTurn(turn: TurnResult, turnNumber: number, baseTimestamp: number): CombatTurn {
    const actions: CombatAction[] = [this.convertAction(turn)];
    const stateChanges: CombatStateChange[] = this.extractStateChanges(turn);

    return {
      turnNumber,
      timestamp: baseTimestamp + (turnNumber * 1000), // 1 second per turn for animation timing
      actions,
      stateChanges
    };
  }

  private convertAction(turn: TurnResult): CombatAction {
    const action: CombatAction = {
      id: `action_${turn.turnNumber}_${turn.actor.id}`,
      actorId: turn.actor.id,
      actorName: turn.actor.name,
      type: turn.action.actionType === 'cast' ? 'ability' : 'attack',
      success: turn.success,
      message: turn.message,
      animationKey: this.getAnimationKey(turn),
      duration: this.getAnimationDuration(turn)
    };

    if (turn.target) {
      action.targetId = turn.target.id;
      action.targetName = turn.target.name;
    }

    if (turn.action.actionType === 'cast' && turn.action.skillId) {
      action.abilityId = turn.action.skillId;
      // Find the skill to get its name
      const skill = turn.actor.abilities.find(a =>
        a.name.toLowerCase().replace(/\s+/g, '_') === turn.action.skillId
      );
      if (skill) {
        action.abilityName = skill.name;
        action.mpCost = skill.mpCost;
      }
    }

    if (turn.damage) {
      action.damage = turn.damage;
    }

    if (turn.heal) {
      action.heal = turn.heal;
    }

    return action;
  }

  private extractStateChanges(turn: TurnResult): CombatStateChange[] {
    const changes: CombatStateChange[] = [];

    // Actor MP change (if skill was used)
    if ((turn as any).skill && turn.success) {
      const skill = (turn as any).skill;
      changes.push({
        participantId: turn.actor.id,
        participantName: turn.actor.name,
        statChanges: {
          mp: {
            before: turn.actor.currentStats.mp + skill.mpCost,
            after: turn.actor.currentStats.mp,
            change: -skill.mpCost
          }
        },
        buffsAdded: [],
        buffsRemoved: [],
        statusChanged: {}
      });
    }

    // Target HP change
    if (turn.target && (turn.damage || turn.heal)) {
      const hpChange = turn.damage ? -turn.damage : (turn.heal || 0);
      const statusChanged: any = {};
      
      if (turn.target.isAlive === false && turn.target.currentStats.hp <= 0) {
        statusChanged.isAlive = { before: true, after: false };
      }

      changes.push({
        participantId: turn.target.id,
        participantName: turn.target.name,
        statChanges: {
          hp: {
            before: turn.beforeHp || turn.target.currentStats.hp,
            after: turn.afterHp || turn.target.currentStats.hp,
            change: hpChange
          }
        },
        buffsAdded: [],
        buffsRemoved: [],
        statusChanged
      });
    }

    return changes;
  }

  private getAnimationKey(turn: TurnResult): string {
    if (!turn.success) {
      return 'action_failed';
    }

    switch (turn.action.actionType) {
      case 'attack':
        return turn.action.skillId ? 'skill_attack' : 'basic_attack';
      case 'cast':
        return 'skill_cast';
      default:
        return 'action_idle';
    }
  }

  private getAnimationDuration(turn: TurnResult): number {
    // Base duration in milliseconds
    if (!turn.success) return 500;

    switch (turn.action.actionType) {
      case 'attack':
        return turn.action.skillId ? 1500 : 1000;
      case 'cast':
        return 2000;
      default:
        return 500;
    }
  }

  private generateFilename(dungeonId: number, battleId: number, timestamp: Date): string {
    const dateStr = timestamp.toISOString().slice(0, 19).replace(/:/g, '-');
    return `combat_d${dungeonId}_b${battleId}_${dateStr}.json`;
  }

  exportDungeonSummary(dungeonId: number, dungeonName: string, battleFiles: string[]): string {
    const summary = {
      dungeonId,
      dungeonName,
      totalBattles: battleFiles.length,
      battleFiles,
      generatedAt: new Date().toISOString()
    };

    const filename = `dungeon_${dungeonId}_summary.json`;
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2), 'utf-8');

    return filepath;
  }
}