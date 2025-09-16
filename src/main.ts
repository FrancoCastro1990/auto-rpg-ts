#!/usr/bin/env node

import { DungeonManager } from './systems/DungeonManager';
import { DataLoader } from './loaders/DataLoader';
import { ReportGenerator } from './utils/ReportGenerator';
import { join } from 'path';
import chalk from 'chalk';

interface GameOptions {
  dataPath?: string;
  dungeonFile?: string;
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'VERBOSE';
  useColors?: boolean;
  compactMode?: boolean;
  maxTurnsPerBattle?: number;
  generateReport?: boolean;
  reportFormat?: 'text' | 'json' | 'html' | 'markdown';
  saveReport?: boolean;
}

class AutoRPGGame {
  private dungeonManager: DungeonManager;
  private dataLoader: DataLoader;
  private options: GameOptions;

  constructor(options: GameOptions = {}) {
    this.options = {
      dataPath: './data',
      dungeonFile: 'dungeon_01.json',
      logLevel: 'INFO',
      useColors: true,
      compactMode: false,
      maxTurnsPerBattle: 100,
      generateReport: true,
      reportFormat: 'text',
      saveReport: false,
      ...options
    };

    this.dataLoader = new DataLoader(this.options.dataPath!);
    this.dungeonManager = new DungeonManager(this.options.dataPath!, {
      logBattles: true,
      maxTurnsPerBattle: this.options.maxTurnsPerBattle!,
      logConfig: {
        logLevel: this.options.logLevel!,
        useColors: this.options.useColors!,
        compactMode: this.options.compactMode!,
        showTurnNumbers: true,
        showParticipantStats: true,
        showDamageNumbers: true
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log(chalk.cyan('🎮 Initializing Auto-RPG Game...\n'));

      await this.dungeonManager.initialize();

      console.log(chalk.green('✅ Game initialized successfully!\n'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize game:'), error);
      throw error;
    }
  }

  async runAdventure(): Promise<void> {
    try {
      console.log(chalk.yellow('🚀 Starting Adventure!\n'));

      // Load default party
      const { party } = await this.dataLoader.validateDataIntegrity();

      if (!party || party.length === 0) {
        throw new Error('No party members found in data files');
      }

      console.log(chalk.blue(`👥 Party assembled: ${party.map(p => p.name).join(', ')}\n`));

      // Run the dungeon
      const progress = await this.dungeonManager.executeDungeon(
        this.options.dungeonFile!,
        party
      );

      // Display final results
      this.displayResults(progress);

      // Generate report if requested
      if (this.options.generateReport) {
        await this.generateReport(progress);
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Adventure failed:'), error);
      throw error;
    }
  }

  private displayResults(progress: any): void {
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('📊 ADVENTURE SUMMARY'));
    console.log(chalk.cyan('='.repeat(60)));

    const status = progress.isVictorious ?
      chalk.green('🎉 VICTORY!') :
      chalk.red('💀 DEFEAT');

    console.log(`Status: ${status}`);
    console.log(`Battles Completed: ${progress.completedBattles.length}`);
    console.log(`Total Turns: ${progress.totalTurns}`);

    if (progress.endTime) {
      const duration = progress.endTime.getTime() - progress.startTime.getTime();
      console.log(`Duration: ${Math.round(duration / 1000)}s`);
    }

    console.log('\n👥 Final Party Status:');
    progress.partyState.forEach((member: any) => {
      const status = member.isAlive ? chalk.green('✅') : chalk.red('💀');
      const hpColor = member.currentStats.hp > member.maxStats.hp * 0.5 ?
        chalk.green : member.currentStats.hp > member.maxStats.hp * 0.25 ?
        chalk.yellow : chalk.red;

      console.log(`  ${status} ${member.name} (${member.job}): ${hpColor(`${member.currentStats.hp}/${member.maxStats.hp} HP`)}, ${member.currentStats.mp}/${member.maxStats.mp} MP`);
    });

    if (!progress.isVictorious) {
      console.log(chalk.red('\n💔 Better luck next time, adventurer!'));
    } else {
      console.log(chalk.green('\n🎊 Congratulations on your victory!'));
    }

    console.log(chalk.cyan('\n' + '='.repeat(60)));
  }

  private async generateReport(progress: any): Promise<void> {
    try {
      console.log(chalk.yellow('\n📝 Generating detailed report...'));

      const analysis = ReportGenerator.analyzeDungeon(progress);
      const report = ReportGenerator.generateReport(analysis, this.options.reportFormat!);

      if (this.options.saveReport) {
        const savedPath = ReportGenerator.saveReport(analysis, this.options.reportFormat!, './reports');
        console.log(chalk.green(`💾 Report saved to: ${savedPath}`));
      } else {
        console.log(chalk.cyan('\n📄 DETAILED REPORT:'));
        console.log(chalk.cyan('-'.repeat(40)));
        console.log(report);
      }

    } catch (error) {
      console.warn(chalk.yellow('⚠️ Failed to generate report:'), error);
    }
  }

  async playCustomDungeon(dungeonFile: string, customParty?: any[]): Promise<void> {
    try {
      console.log(chalk.yellow(`🏰 Loading custom dungeon: ${dungeonFile}\n`));

      let party = customParty;
      if (!party) {
        const data = await this.dataLoader.validateDataIntegrity();
        party = data.party;
      }

      if (!party || party.length === 0) {
        throw new Error('No party members available');
      }

      const progress = await this.dungeonManager.executeDungeon(dungeonFile, party);
      this.displayResults(progress);

      if (this.options.generateReport) {
        await this.generateReport(progress);
      }

    } catch (error) {
      console.error(chalk.red('❌ Custom dungeon failed:'), error);
      throw error;
    }
  }

  getGameStatistics(): any {
    const progress = this.dungeonManager.getCurrentProgress();
    return progress ? this.dungeonManager.getDungeonStatistics() : null;
  }

  updateGameOptions(newOptions: Partial<GameOptions>): void {
    this.options = { ...this.options, ...newOptions };

    // Update dungeon manager settings
    this.dungeonManager.updateSettings({
      maxTurnsPerBattle: this.options.maxTurnsPerBattle!
    });

    // Update logger configuration
    this.dungeonManager.updateLoggerConfig({
      logLevel: this.options.logLevel!,
      useColors: this.options.useColors!,
      compactMode: this.options.compactMode!
    });
  }
}

// CLI interface
async function runCLI(): Promise<void> {
  const args = process.argv.slice(2);

  const options: GameOptions = {
    dataPath: getArgValue(args, '--data-path') || './data',
    dungeonFile: getArgValue(args, '--dungeon') || 'dungeon_01.json',
    logLevel: (getArgValue(args, '--log-level') as any) || 'INFO',
    useColors: !args.includes('--no-colors'),
    compactMode: args.includes('--compact'),
    maxTurnsPerBattle: parseInt(getArgValue(args, '--max-turns') || '100'),
    generateReport: !args.includes('--no-report'),
    reportFormat: (getArgValue(args, '--report-format') as any) || 'text',
    saveReport: args.includes('--save-report')
  };

  try {
    const game = new AutoRPGGame(options);
    await game.initialize();

    if (args.includes('--help') || args.includes('-h')) {
      showHelp();
      return;
    }

    const customDungeon = getArgValue(args, '--custom-dungeon');
    if (customDungeon) {
      await game.playCustomDungeon(customDungeon);
    } else {
      await game.runAdventure();
    }

  } catch (error) {
    console.error(chalk.red('\n💥 Game crashed:'), error);
    process.exit(1);
  }
}

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}

function showHelp(): void {
  console.log(chalk.cyan(`
🎮 Auto-RPG Game - TypeScript RPG Auto-Battler

USAGE:
  npm start [options]
  npx ts-node src/main.ts [options]

OPTIONS:
  --data-path <path>           Path to data directory (default: ./data)
  --dungeon <file>             Dungeon file to play (default: dungeon_01.json)
  --custom-dungeon <file>      Play a specific dungeon file
  --log-level <level>          Log level: ERROR, WARN, INFO, DEBUG, VERBOSE (default: INFO)
  --no-colors                  Disable colored output
  --compact                    Use compact logging mode
  --max-turns <number>         Maximum turns per battle (default: 100)
  --no-report                  Skip report generation
  --report-format <format>     Report format: text, json, html, markdown (default: text)
  --save-report               Save report to file instead of displaying
  --help, -h                   Show this help message

EXAMPLES:
  npm start                                    # Run with default settings
  npm start -- --dungeon dungeon_02.json      # Play specific dungeon
  npm start -- --compact --no-colors          # Minimal logging
  npm start -- --log-level DEBUG --save-report # Debug mode with saved report
  npm start -- --custom-dungeon my_dungeon.json # Play custom dungeon

FEATURES:
  ⚔️  Automated turn-based combat
  🏰 Multi-battle dungeon exploration
  📊 Detailed battle analysis and reporting
  🎨 Colorized console output
  ⚙️  Configurable game settings
  💾 Save/load dungeon progress
  📈 Battle statistics and performance metrics
`));
}

// Export for programmatic use
export { AutoRPGGame, GameOptions };

// Run CLI if this file is executed directly
if (require.main === module) {
  runCLI();
}