import { Character, EnemyInstance, Dungeon, BattleResult, PartyMember } from '../models/types';
import { DataLoader, EntityFactory } from '../loaders';
import { BattleSystem, TurnResult } from './BattleSystem';
import { BattleLogger, BattleLogConfig } from '../utils/BattleLogger';
import { CombatDataExporter } from '../utils/CombatDataExporter';
import { DataLoadError, ValidationError, ConfigurationError, ErrorHandler } from '../utils/errors';

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
  exportCombatData?: boolean;
  combatDataOutputDir?: string;
}

export class DungeonManager {
  private dataLoader: DataLoader;
  private entityFactory: EntityFactory;
  private settings: DungeonSettings;
  private currentProgress: DungeonProgress | null = null;
  private logger: BattleLogger;
  private combatDataExporter?: CombatDataExporter;

  constructor(dataPath: string = './data', settings?: Partial<DungeonSettings>) {
    // Validar ruta de datos
    if (!dataPath || typeof dataPath !== 'string') {
      throw new ValidationError('Data path must be a non-empty string');
    }

    // Validar configuración
    if (settings) {
      if (settings.maxTurnsPerBattle !== undefined && settings.maxTurnsPerBattle <= 0) {
        throw new ConfigurationError('maxTurnsPerBattle must be a positive number', 'maxTurnsPerBattle');
      }

      if (settings.recovery) {
        if (settings.recovery.hpRecoveryPercent < 0 || settings.recovery.hpRecoveryPercent > 100) {
          throw new ConfigurationError('hpRecoveryPercent must be between 0 and 100', 'recovery.hpRecoveryPercent');
        }
        if (settings.recovery.mpRecoveryPercent < 0 || settings.recovery.mpRecoveryPercent > 100) {
          throw new ConfigurationError('mpRecoveryPercent must be between 0 and 100', 'recovery.mpRecoveryPercent');
        }
      }
    }

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
      exportCombatData: false,
      combatDataOutputDir: './combat-animations',
      ...settings
    };
    this.entityFactory = new EntityFactory([], [], []);

    this.logger = new BattleLogger({
      useColors: true,
      logLevel: 'DEBUG',
      compactMode: false,
      showTurnNumbers: true,
      showParticipantStats: true,
      showDamageNumbers: true,
      ...this.settings.logConfig
    });

    if (this.settings.exportCombatData) {
      this.combatDataExporter = new CombatDataExporter(this.settings.combatDataOutputDir);
    }
  }

  async initialize(): Promise<void> {
    try {
      const { skills, jobs, enemies } = await this.dataLoader.validateDataIntegrity();
      this.entityFactory = new EntityFactory(skills, jobs, enemies);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new DataLoadError(`Failed to initialize dungeon manager: ${err.message}`);
    }
  }

  async startDungeon(dungeonFile: string, partyMembers: PartyMember[]): Promise<DungeonProgress> {
    // Validar entrada
    if (!dungeonFile || typeof dungeonFile !== 'string') {
      throw new ValidationError('Dungeon file path must be a non-empty string');
    }

    if (!Array.isArray(partyMembers) || partyMembers.length === 0) {
      throw new ValidationError('Party members must be a non-empty array');
    }

    // Validar miembros del party
    for (let i = 0; i < partyMembers.length; i++) {
      const member = partyMembers[i];
      if (!member || typeof member !== 'object') {
        throw new ValidationError(`Party member at index ${i} is invalid`);
      }
      if (!member.name || typeof member.name !== 'string') {
        throw new ValidationError(`Party member ${i} must have a valid name`);
      }
      if (!member.job || typeof member.job !== 'string') {
        throw new ValidationError(`Party member ${i} must have a valid job`);
      }
      if (!member.level || typeof member.level !== 'number' || member.level <= 0) {
        throw new ValidationError(`Party member ${i} must have a valid level`);
      }
    }

    if (!this.entityFactory) {
      await this.initialize();
    }

    try {
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new DataLoadError(`Failed to start dungeon: ${err.message}`, dungeonFile);
    }
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
    // Validar entrada
    if (!dungeonFile || typeof dungeonFile !== 'string') {
      throw new ValidationError('Dungeon file path must be a non-empty string');
    }

    let progress: DungeonProgress;

    try {
      if (this.currentProgress && !this.currentProgress.isComplete) {
        progress = this.currentProgress;
      } else {
        if (!partyMembers) {
          throw new ValidationError('Party members required to start new dungeon');
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new DataLoadError(`Failed to execute dungeon: ${err.message}`, dungeonFile);
    }
  }

  private async executeBattle(
    battleConfig: any,
    dungeon: Dungeon,
    battleNumber: number,
    totalBattles: number
  ): Promise<{ result: BattleResult; turnHistory: TurnResult[] }> {
    const enemies = this.entityFactory.createEnemiesFromBattle(battleConfig.enemies);

    const battleSystem = new BattleSystem(this.settings.logBattles ? this.logger : undefined, this.entityFactory);
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

    const initialParty = JSON.parse(JSON.stringify(this.currentProgress!.partyState));
    const initialEnemies = JSON.parse(JSON.stringify(enemies));

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

    // Export combat data if enabled
    if (this.combatDataExporter && this.currentProgress) {
      const battleStartTime = new Date();
      const battleEndTime = new Date();
      
      const exportedFile = this.combatDataExporter.exportCombatData(
        this.currentProgress.dungeonId,
        dungeon.name,
        battleConfig.id,
        battleNumber,
        maxTurns,
        initialParty,
        initialEnemies,
        this.currentProgress.partyState, // final party
        enemies, // final enemies
        turnHistory,
        result,
        battleStartTime,
        battleEndTime
      );

      if (this.settings.logBattles) {
        this.logger.log('INFO', 'COMBAT_EXPORT', `Combat data exported to: ${exportedFile}`);
      }
    }

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
    if (!Array.isArray(party)) {
      throw new ValidationError('Party must be an array');
    }

    for (const member of party) {
      if (!member || typeof member !== 'object') {
        throw new ValidationError('Invalid party member');
      }

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
    if (!saveData || typeof saveData !== 'string') {
      throw new ValidationError('Save data must be a non-empty string');
    }

    try {
      const progress: DungeonProgress = JSON.parse(saveData);

      // Validar estructura del progreso
      if (!progress || typeof progress !== 'object') {
        throw new ValidationError('Invalid save data structure');
      }

      if (typeof progress.dungeonId !== 'number') {
        throw new ValidationError('Save data must contain a valid dungeonId');
      }

      if (!Array.isArray(progress.partyState)) {
        throw new ValidationError('Save data must contain a valid partyState array');
      }

      return this.loadDungeonProgress(progress);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error(String(error));
      throw new DataLoadError(`Failed to load progress: ${err.message}`);
    }
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