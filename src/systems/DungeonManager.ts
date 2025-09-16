import { Character, EnemyInstance, Dungeon, BattleResult, PartyMember } from '../models/types';
import { DataLoader, EntityFactory } from '../loaders';
import { BattleSystem, TurnResult } from './BattleSystem';
import { BattleLogger, BattleLogConfig } from '../utils/BattleLogger';

export interface DungeonProgress {
  dungeonId: number;
  currentBattleIndex: number;
  completedBattles: number[];
  partyState: Character[];
  isComplete: boolean;
  isVictorious: boolean;
  totalTurns: number;
  battleHistory: Array<{
    battleId: number;
    result: BattleResult;
    turnHistory: TurnResult[];
  }>;
  startTime: Date;
  endTime?: Date;
  isPaused?: boolean;
  pausedAt?: Date;
  totalPausedTime?: number;
}

export interface BattleRecovery {
  hpRecoveryPercent: number;
  mpRecoveryPercent: number;
  fullRecoveryOnBossVictory: boolean;
}

export interface DungeonSettings {
  recovery: BattleRecovery;
  maxTurnsPerBattle: number;
  allowSaveState: boolean;
  logBattles: boolean;
  logConfig?: Partial<BattleLogConfig>;
}

export class DungeonManager {
  private dataLoader: DataLoader;
  private entityFactory: EntityFactory;
  private settings: DungeonSettings;
  private currentProgress: DungeonProgress | null = null;
  private logger: BattleLogger;

  constructor(dataPath: string = './data', settings?: Partial<DungeonSettings>) {
    this.dataLoader = new DataLoader(dataPath);
    this.settings = {
      recovery: {
        hpRecoveryPercent: 25,
        mpRecoveryPercent: 50,
        fullRecoveryOnBossVictory: true
      },
      maxTurnsPerBattle: 100,
      allowSaveState: true,
      logBattles: true,
      ...settings
    };
    this.entityFactory = new EntityFactory([], [], []);

    this.logger = new BattleLogger({
      useColors: true,
      logLevel: 'INFO',
      compactMode: false,
      showTurnNumbers: true,
      showParticipantStats: true,
      showDamageNumbers: true,
      ...this.settings.logConfig
    });
  }

  async initialize(): Promise<void> {
    const { skills, jobs, enemies } = await this.dataLoader.validateDataIntegrity();
    this.entityFactory = new EntityFactory(skills, jobs, enemies);
  }

  async startDungeon(dungeonFile: string, partyMembers: PartyMember[]): Promise<DungeonProgress> {
    if (!this.entityFactory) {
      await this.initialize();
    }

    const dungeon = await this.dataLoader.loadDungeon(dungeonFile);
    const party = partyMembers.map(member => this.entityFactory.createCharacter(member));

    this.currentProgress = {
      dungeonId: dungeon.id,
      currentBattleIndex: 0,
      completedBattles: [],
      partyState: party,
      isComplete: false,
      isVictorious: false,
      totalTurns: 0,
      battleHistory: [],
      startTime: new Date()
    };

    return this.currentProgress;
  }

  async loadDungeonProgress(saveData: DungeonProgress): Promise<DungeonProgress> {
    if (!this.entityFactory) {
      await this.initialize();
    }

    this.currentProgress = {
      ...saveData,
      partyState: saveData.partyState.map(member => ({ ...member }))
    };

    return this.currentProgress;
  }

  async executeDungeon(dungeonFile: string, partyMembers?: PartyMember[]): Promise<DungeonProgress> {
    let progress: DungeonProgress;

    if (this.currentProgress && !this.currentProgress.isComplete) {
      progress = this.currentProgress;
    } else {
      if (!partyMembers) {
        throw new Error('Party members required to start new dungeon');
      }
      progress = await this.startDungeon(dungeonFile, partyMembers);
    }

    const dungeon = await this.dataLoader.loadDungeon(dungeonFile);

    if (this.settings.logBattles) {
      this.logger.logDungeonStart(
        dungeon.name,
        progress.partyState.map(p => p.name),
        dungeon.battles.length
      );
    }

    const sortedBattles = dungeon.battles.sort((a, b) => a.order - b.order);

    for (let i = progress.currentBattleIndex; i < sortedBattles.length; i++) {
      const battle = sortedBattles[i]!;
      const result = await this.executeBattle(battle, dungeon, i + 1, sortedBattles.length);

      progress.completedBattles.push(battle.id);
      progress.currentBattleIndex = i + 1;
      progress.totalTurns += result.result.turns;

      if (!result.result.victory) {
        progress.isComplete = true;
        progress.isVictorious = false;
        progress.endTime = new Date();

        if (this.settings.logBattles) {
          this.logger.logError('DUNGEON', `💀 DUNGEON FAILED at battle ${i + 1}`);
          this.logger.logError('DUNGEON', `Reason: ${result.result.reason}`);
        }
        break;
      }

      const isBossBattle = battle.enemies.some(enemy => {
        const enemyTemplate = this.entityFactory['enemies'].get(enemy.type);
        return enemyTemplate?.isBoss;
      });

      this.applyPostBattleRecovery(progress.partyState, isBossBattle);

      if (i === sortedBattles.length - 1) {
        progress.isComplete = true;
        progress.isVictorious = true;
        progress.endTime = new Date();

        if (this.settings.logBattles) {
          this.logger.logDungeonEnd(progress);
        }
      }
    }

    this.currentProgress = progress;
    return progress;
  }

  private async executeBattle(
    battleConfig: any,
    dungeon: Dungeon,
    battleNumber: number,
    totalBattles: number
  ): Promise<{ result: BattleResult; turnHistory: TurnResult[] }> {
    const enemies = this.entityFactory.createEnemiesFromBattle(battleConfig.enemies);

    const battleSystem = new BattleSystem(this.settings.logBattles ? this.logger : undefined);
    battleSystem.initializeBattle(this.currentProgress!.partyState, enemies);

    // Log turn order if enabled
    if (this.settings.logBattles) {
      const turnOrder = battleSystem.getTurnOrder();
      this.logger.logTurnOrder(turnOrder);
    }

    const isBossBattle = enemies.some(enemy => enemy.isBoss);

    if (this.settings.logBattles) {
      this.logger.logDungeonProgress(
        battleNumber,
        totalBattles,
        `${battleConfig.enemies.map((e: any) => e.name || e.type).join(', ')}${isBossBattle ? ' 👑 BOSS BATTLE' : ''}`
      );

      this.logger.logBattleStart(
        this.currentProgress!.partyState,
        enemies,
        battleNumber,
        totalBattles
      );
    }

    // Calculate max turns: battle-specific, then dungeon default, then system default
    const maxTurns = battleConfig.maxTurns ?? dungeon.defaultMaxTurns ?? this.settings.maxTurnsPerBattle;

    const result = battleSystem.simulateFullBattle(maxTurns);
    const turnHistory = battleSystem.getTurnHistory();

    if (this.settings.logBattles) {
      this.logger.logBattleEnd(result);
    }

    this.currentProgress!.battleHistory.push({
      battleId: battleConfig.id,
      result,
      turnHistory
    });

    this.updatePartyStateFromBattle(result);

    return { result, turnHistory };
  }

  private updatePartyStateFromBattle(result: BattleResult): void {
    if (!this.currentProgress) return;

    for (const ally of result.survivingAllies) {
      const partyMember = this.currentProgress.partyState.find(p => p.id === ally.id);
      if (partyMember) {
        partyMember.currentStats = { ...ally.currentStats };
        partyMember.buffs = [...ally.buffs];
        partyMember.isAlive = ally.isAlive;
      }
    }

    const defeatedAllies = this.currentProgress.partyState.filter(
      p => !result.survivingAllies.some(s => s.id === p.id)
    );

    for (const defeatedAlly of defeatedAllies) {
      defeatedAlly.isAlive = false;
      defeatedAlly.currentStats.hp = 0;
    }
  }

  private applyPostBattleRecovery(party: Character[], isBossBattle: boolean): void {
    for (const member of party) {
      if (!member.isAlive) continue;

      if (isBossBattle && this.settings.recovery.fullRecoveryOnBossVictory) {
        member.currentStats.hp = member.maxStats.hp;
        member.currentStats.mp = member.maxStats.mp;
        member.buffs = [];
      } else {
        const hpRecovery = Math.floor(member.maxStats.hp * (this.settings.recovery.hpRecoveryPercent / 100));
        const mpRecovery = Math.floor(member.maxStats.mp * (this.settings.recovery.mpRecoveryPercent / 100));

        member.currentStats.hp = Math.min(member.maxStats.hp, member.currentStats.hp + hpRecovery);
        member.currentStats.mp = Math.min(member.maxStats.mp, member.currentStats.mp + mpRecovery);

        member.buffs = member.buffs.filter(buff => buff.remainingTurns > 5);
      }
    }

    if (this.settings.logBattles) {
      const recoveryType = isBossBattle && this.settings.recovery.fullRecoveryOnBossVictory
        ? 'Full recovery (boss victory)'
        : `Recovery: ${this.settings.recovery.hpRecoveryPercent}% HP, ${this.settings.recovery.mpRecoveryPercent}% MP`;

      const partyStatus = party.map(member => ({
        name: member.name,
        hp: member.currentStats.hp,
        maxHp: member.maxStats.hp,
        mp: member.currentStats.mp,
        maxMp: member.maxStats.mp
      }));

      this.logger.logDungeonRecovery(recoveryType, partyStatus);
    }
  }

  getCurrentProgress(): DungeonProgress | null {
    return this.currentProgress;
  }

  saveProgress(): string | null {
    if (!this.currentProgress || !this.settings.allowSaveState) {
      return null;
    }

    return JSON.stringify(this.currentProgress, null, 2);
  }

  async loadProgress(saveData: string): Promise<DungeonProgress> {
    const progress: DungeonProgress = JSON.parse(saveData);
    return this.loadDungeonProgress(progress);
  }

  getDetailedReport(): string {
    if (!this.currentProgress) {
      return 'No dungeon progress available';
    }

    const progress = this.currentProgress;
    const duration = progress.endTime
      ? this.formatDuration(progress.startTime, progress.endTime)
      : 'In progress';

    let report = `🏰 DUNGEON REPORT\n`;
    report += `==================\n`;
    report += `Dungeon ID: ${progress.dungeonId}\n`;
    report += `Status: ${progress.isComplete ? (progress.isVictorious ? '🎉 COMPLETED' : '💀 FAILED') : '⏳ IN PROGRESS'}\n`;
    report += `Duration: ${duration}\n`;
    report += `Total Turns: ${progress.totalTurns}\n`;
    report += `Battles Completed: ${progress.completedBattles.length}\n\n`;

    report += `👥 FINAL PARTY STATUS:\n`;
    for (const member of progress.partyState) {
      const status = member.isAlive ? '✅' : '💀';
      report += `${status} ${member.name} (${member.job}): ${member.currentStats.hp}/${member.maxStats.hp} HP, ${member.currentStats.mp}/${member.maxStats.mp} MP\n`;
    }

    report += `\n⚔️ BATTLE HISTORY:\n`;
    progress.battleHistory.forEach((battle, index) => {
      const result = battle.result.victory ? '✅' : '❌';
      report += `${index + 1}. Battle ${battle.battleId}: ${result} (${battle.result.turns} turns)\n`;
    });

    return report;
  }

  getDungeonStatistics(): {
    totalBattles: number;
    victoriesBattles: number;
    averageTurnsPerBattle: number;
    totalDamageDealt: number;
    totalHealingDone: number;
    partyDeaths: number;
  } {
    if (!this.currentProgress) {
      return {
        totalBattles: 0,
        victoriesBattles: 0,
        averageTurnsPerBattle: 0,
        totalDamageDealt: 0,
        totalHealingDone: 0,
        partyDeaths: 0
      };
    }

    const battles = this.currentProgress.battleHistory;
    const victories = battles.filter(b => b.result.victory).length;
    const totalTurns = battles.reduce((sum, b) => sum + b.result.turns, 0);
    const avgTurns = battles.length > 0 ? totalTurns / battles.length : 0;

    let totalDamage = 0;
    let totalHealing = 0;

    battles.forEach(battle => {
      battle.turnHistory.forEach(turn => {
        if (turn.damage) totalDamage += turn.damage;
        if (turn.heal) totalHealing += turn.heal;
      });
    });

    const partyDeaths = this.currentProgress.partyState.filter(p => !p.isAlive).length;

    return {
      totalBattles: battles.length,
      victoriesBattles: victories,
      averageTurnsPerBattle: Math.round(avgTurns * 10) / 10,
      totalDamageDealt: totalDamage,
      totalHealingDone: totalHealing,
      partyDeaths
    };
  }

  private formatDuration(start: Date, end: Date): string {
    const ms = end.getTime() - start.getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  updateSettings(newSettings: Partial<DungeonSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): DungeonSettings {
    return { ...this.settings };
  }

  getBattleLogger(): BattleLogger {
    return this.logger;
  }

  updateLoggerConfig(config: Partial<BattleLogConfig>): void {
    this.logger.updateConfig(config);
  }
}