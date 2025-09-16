import { BattleParticipant, Character, EnemyInstance, BattleResult } from '../models/types';
import { TurnResult } from '../systems/BattleSystem';
import { DungeonProgress } from '../systems/DungeonManager';
import chalk from 'chalk';

export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
  VERBOSE: 4;
}

export interface LogEntry {
  timestamp: Date;
  level: keyof LogLevel;
  category: string;
  message: string;
  data?: any;
}

export interface BattleLogConfig {
  useColors: boolean;
  logLevel: keyof LogLevel;
  showTimestamps: boolean;
  showTurnNumbers: boolean;
  showParticipantStats: boolean;
  showDamageNumbers: boolean;
  compactMode: boolean;
}

export class BattleLogger {
  private logs: LogEntry[] = [];
  private config: BattleLogConfig;

  constructor(config?: Partial<BattleLogConfig>) {
    this.config = {
      useColors: true,
      logLevel: 'INFO',
      showTimestamps: false,
      showTurnNumbers: true,
      showParticipantStats: true,
      showDamageNumbers: true,
      compactMode: false,
      ...config
    };
  }

  log(level: keyof LogLevel, category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);

    const levelOrder: Record<keyof LogLevel, number> = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      VERBOSE: 4
    };

    if (levelOrder[level] <= levelOrder[this.config.logLevel]) {
      this.printLog(entry);
    }
  }

  private printLog(entry: LogEntry): void {
    let output = '';

    if (this.config.showTimestamps) {
      const time = entry.timestamp.toLocaleTimeString();
      output += this.config.useColors ? chalk.gray(`[${time}] `) : `[${time}] `;
    }

    const levelColors = {
      ERROR: chalk.red,
      WARN: chalk.yellow,
      INFO: chalk.blue,
      DEBUG: chalk.cyan,
      VERBOSE: chalk.gray
    };

    const levelText = this.config.useColors ? levelColors[entry.level](`[${entry.level}]`) : `[${entry.level}]`;
    const categoryText = this.config.useColors ? chalk.magenta(`[${entry.category}]`) : `[${entry.category}]`;

    output += `${levelText} ${categoryText} ${entry.message}`;

    console.log(output);
  }

  // Battle Initialization
  logBattleStart(allies: Character[], enemies: EnemyInstance[], battleNumber?: number, totalBattles?: number): void {
    const battleInfo = battleNumber && totalBattles ? ` ${battleNumber}/${totalBattles}` : '';

    if (!this.config.compactMode) {
      this.log('INFO', 'BATTLE', `${'='.repeat(50)}`);
    }

    this.log('INFO', 'BATTLE', `🏁 Starting Battle${battleInfo}`);

    if (this.config.showParticipantStats) {
      this.log('INFO', 'PARTY', `👥 Party: ${allies.map(a => `${a.name}(${a.job})`).join(', ')}`);
      this.log('INFO', 'ENEMIES', `🐉 Enemies: ${enemies.map(e => {
        const bossIcon = e.isBoss ? '👑' : '';
        return `${e.name}${bossIcon}(${e.type})`;
      }).join(', ')}`);
    }
  }

  // Turn Order
  logTurnOrder(turnOrder: Array<{ participant: BattleParticipant; speed: number; initiative: number }>): void {
    if (this.config.compactMode) return;

    this.log('INFO', 'TURN_ORDER', '📋 Turn Order:');
    turnOrder.forEach((turn, index) => {
      const teamIcon = turn.participant.isEnemy ? '🔴' : '🔵';
      const bossIcon = turn.participant.isBoss ? '👑' : '';
      this.log('INFO', 'TURN_ORDER',
        `   ${index + 1}. ${teamIcon} ${turn.participant.name}${bossIcon} (SPD: ${turn.speed}, Initiative: ${turn.initiative})`
      );
    });
  }

  // Individual Turn Logging
  logTurn(turnResult: TurnResult): void {
    const turnPrefix = this.config.showTurnNumbers ? `Turn ${turnResult.turnNumber}: ` : '';
    const actorName = this.formatParticipantName(turnResult.actor);

    let message = `${turnPrefix}${actorName}`;

    if (turnResult.target) {
      const targetName = this.formatParticipantName(turnResult.target);

      if (turnResult.action.actionType === 'attack') {
        message += ` attacks ${targetName}`;
      } else if (turnResult.action.actionType === 'cast' && turnResult.action.skillId) {
        message += ` casts ${this.formatSkillName(turnResult.action.skillId)} on ${targetName}`;
      }

      if (this.config.showDamageNumbers) {
        if (turnResult.damage) {
          const hpRemaining = `${turnResult.target.currentStats.hp}/${turnResult.target.maxStats.hp}`;
          message += ` → ${this.formatDamage(turnResult.damage)} damage (${hpRemaining} HP)`;
        }
        if (turnResult.heal) {
          const hpAfter = `${turnResult.target.currentStats.hp}/${turnResult.target.maxStats.hp}`;
          message += ` → ${this.formatHealing(turnResult.heal)} healing (${hpAfter} HP)`;
        }
      }

      // Show buff/debuff effects even without damage/heal
      if (turnResult.action.actionType === 'cast' && turnResult.action.skillId) {
        const skillName = turnResult.action.skillId;
        // Check for summon effects first - check the skill name or message content
        if (skillName === 'summon_skeleton' || turnResult.message.includes('summons') || turnResult.message.includes('casts Summon Skeleton')) {
          // Extract summoned creature names from the message
          const summonMatch = turnResult.message.match(/casts Summon Skeleton on (.+)/);
          if (summonMatch) {
            const summonedCreatures = summonMatch[1];
            message += ` → Summons Skeleton`;
          } else {
            console.log('DEBUG: Summon message detected but regex failed. Full message:', JSON.stringify(turnResult.message));
            // Fallback: just show the original message
            message += ` → ${turnResult.message}`;
          }
        }
        // Check if this is a buff/debuff skill by looking at the message content
        else if (turnResult.message.includes('buff applied') || turnResult.message.includes('debuff applied')) {
          message += ` → Buff/Debuff applied`;
        }
      }

      // Show detailed buff/debuff information
      if (turnResult.buffApplied) {
        const statChanges = Object.entries(turnResult.buffApplied.statModifier)
          .map(([stat, value]) => `${stat.toUpperCase()}+${value}`)
          .join(', ');
        message += ` → ${turnResult.buffApplied.name}: ${statChanges} (${turnResult.buffApplied.duration} turns)`;
      }

      if (turnResult.debuffApplied) {
        const statChanges = Object.entries(turnResult.debuffApplied.statModifier)
          .map(([stat, value]) => `${stat.toUpperCase()}${value >= 0 ? '+' : ''}${value}`)
          .join(', ');
        message += ` → ${turnResult.debuffApplied.name}: ${statChanges} (${turnResult.debuffApplied.duration} turns)`;
      }

      // Death notification
      if (turnResult.target.currentStats.hp <= 0) {
        const deathMsg = `💀 ${turnResult.target.name} is defeated!`;
        message += ` | ${this.config.useColors ? chalk.red(deathMsg) : deathMsg}`;
      }
    } else {
      message += ` ${turnResult.message}`;
    }

    this.log('INFO', 'ACTION', message);
  }

  // Battle End
  logBattleEnd(result: BattleResult): void {
    const resultIcon = result.victory ? '🏆' : '💀';
    const resultText = result.victory ? 'VICTORY' : 'DEFEAT';
    const coloredResult = this.config.useColors ?
      (result.victory ? chalk.green(resultText) : chalk.red(resultText)) :
      resultText;

    this.log('INFO', 'RESULT', `${resultIcon} ${coloredResult} - ${result.reason}`);
    this.log('INFO', 'RESULT', `⏱️ Battle duration: ${result.turns} turns`);

    if (this.config.showParticipantStats && !this.config.compactMode) {
      if (result.survivingAllies.length > 0) {
        this.log('INFO', 'SURVIVORS', '✅ Surviving allies:');
        result.survivingAllies.forEach(ally => {
          const hp = `${ally.currentStats.hp}/${ally.maxStats.hp}`;
          const mp = `${ally.currentStats.mp}/${ally.maxStats.mp}`;
          this.log('INFO', 'SURVIVORS', `   - ${ally.name}: ${hp} HP, ${mp} MP`);
        });
      }

      if (result.defeatedEnemies.length > 0) {
        this.log('INFO', 'DEFEATED', '💀 Defeated enemies:');
        result.defeatedEnemies.forEach(enemy => {
          this.log('INFO', 'DEFEATED', `   - ${enemy.name} (${enemy.type})`);
        });
      }
    }

    if (!this.config.compactMode) {
      this.log('INFO', 'BATTLE', `${'='.repeat(50)}`);
    }
  }

  // Dungeon Progress
  logDungeonStart(dungeonName: string, partyNames: string[], totalBattles: number): void {
    this.log('INFO', 'DUNGEON', `🏰 Starting Dungeon: ${dungeonName}`);
    this.log('INFO', 'DUNGEON', `👥 Party: ${partyNames.join(', ')}`);
    this.log('INFO', 'DUNGEON', `⚔️ Total battles: ${totalBattles}`);
    this.log('INFO', 'DUNGEON', '');
  }

  logDungeonProgress(currentBattle: number, totalBattles: number, battleName: string): void {
    const progress = `[${currentBattle}/${totalBattles}]`;
    this.log('INFO', 'PROGRESS', `📍 ${progress} ${battleName}`);
  }

  logDungeonRecovery(recoveryType: string, partyStatus: Array<{ name: string; hp: number; maxHp: number; mp: number; maxMp: number }>): void {
    this.log('INFO', 'RECOVERY', `💚 ${recoveryType}`);

    if (this.config.showParticipantStats && !this.config.compactMode) {
      partyStatus.forEach(member => {
        const hpPercent = Math.round((member.hp / member.maxHp) * 100);
        const mpPercent = Math.round((member.mp / member.maxMp) * 100);
        this.log('VERBOSE', 'RECOVERY', `   ${member.name}: ${hpPercent}% HP, ${mpPercent}% MP`);
      });
    }
  }

  logDungeonEnd(progress: DungeonProgress): void {
    const resultIcon = progress.isVictorious ? '🎉' : '💀';
    const resultText = progress.isVictorious ? 'COMPLETED' : 'FAILED';
    const coloredResult = this.config.useColors ?
      (progress.isVictorious ? chalk.green(resultText) : chalk.red(resultText)) :
      resultText;

    this.log('INFO', 'DUNGEON', '');
    this.log('INFO', 'DUNGEON', `${resultIcon} DUNGEON ${coloredResult}`);

    if (progress.endTime) {
      const duration = this.formatDuration(progress.startTime, progress.endTime);
      this.log('INFO', 'DUNGEON', `⏱️ Total time: ${duration}`);
    }

    this.log('INFO', 'DUNGEON', `🎯 Battles completed: ${progress.completedBattles.length}`);
    this.log('INFO', 'DUNGEON', `⚔️ Total turns: ${progress.totalTurns}`);
  }

  // Helper formatting methods
  private formatParticipantName(participant: BattleParticipant): string {
    if (!this.config.useColors) {
      return participant.name;
    }

    if (participant.isEnemy) {
      return participant.isBoss ? chalk.red.bold(participant.name) : chalk.red(participant.name);
    } else {
      return chalk.blue(participant.name);
    }
  }

  private formatSkillName(skillId: string): string {
    const skillName = skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return this.config.useColors ? chalk.cyan(skillName) : skillName;
  }

  private formatDamage(damage: number): string {
    return this.config.useColors ? chalk.red(`${damage}`) : `${damage}`;
  }

  private formatHealing(heal: number): string {
    return this.config.useColors ? chalk.green(`${heal}`) : `${heal}`;
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

  // Configuration
  updateConfig(newConfig: Partial<BattleLogConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): BattleLogConfig {
    return { ...this.config };
  }

  // Log Management
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return this.logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const data = log.data ? ` | ${JSON.stringify(log.data)}` : '';
      return `${timestamp} [${log.level}] [${log.category}] ${log.message}${data}`;
    }).join('\n');
  }

  // Statistics
  getLogStatistics(): {
    totalLogs: number;
    byLevel: Record<keyof LogLevel, number>;
    byCategory: Record<string, number>;
    timespan: { start: Date; end: Date } | null;
  } {
    if (this.logs.length === 0) {
      return {
        totalLogs: 0,
        byLevel: { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, VERBOSE: 0 },
        byCategory: {},
        timespan: null
      };
    }

    const byLevel: Record<keyof LogLevel, number> = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, VERBOSE: 0 };
    const byCategory: Record<string, number> = {};

    this.logs.forEach(log => {
      byLevel[log.level]++;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    });

    return {
      totalLogs: this.logs.length,
      byLevel,
      byCategory,
      timespan: {
        start: this.logs[0]!.timestamp,
        end: this.logs[this.logs.length - 1]!.timestamp
      }
    };
  }

  // Error and Warning logging
  logError(category: string, message: string, error?: any): void {
    this.log('ERROR', category, message, error);
  }

  logWarning(category: string, message: string, data?: any): void {
    this.log('WARN', category, message, data);
  }

  logDebug(category: string, message: string, data?: any): void {
    this.log('DEBUG', category, message, data);
  }

  logVerbose(category: string, message: string, data?: any): void {
    this.log('VERBOSE', category, message, data);
  }
}