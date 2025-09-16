#!/usr/bin/env node

import { DungeonManager } from './systems/DungeonManager';
import { DataLoader } from './loaders/DataLoader';
import { ReportGenerator } from './utils/ReportGenerator';
import { join } from 'path';
import chalk from 'chalk';
import { ValidationError, ConfigurationError, DataLoadError, ErrorHandler } from './utils/errors';

interface GameOptions {
  dataPath?: string;
  dungeonFile?: string;
  partyFile?: string;
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'VERBOSE';
  useColors?: boolean;
  compactMode?: boolean;
  maxTurnsPerBattle?: number;
  generateReport?: boolean;
  reportFormat?: 'text' | 'json' | 'html' | 'markdown';
  saveReport?: boolean;
  exportCombatData?: boolean;
  combatDataOutputDir?: string;
  interactive?: boolean;
  listMode?: boolean;
}

class AutoRPGGame {
  private dungeonManager: DungeonManager;
  private dataLoader: DataLoader;
  private options: GameOptions;

  constructor(options: GameOptions = {}) {
    this.options = {
      dataPath: './data',
      dungeonFile: 'dungeon_01.json',
      partyFile: 'party.json',
      logLevel: 'INFO',
      useColors: true,
      compactMode: false,
      maxTurnsPerBattle: 100,
      generateReport: true,
      reportFormat: 'text',
      saveReport: false,
      exportCombatData: false,
      combatDataOutputDir: './combat-animations',
      interactive: false,
      listMode: false,
      ...options
    };

    this.dataLoader = new DataLoader(this.options.dataPath!);
    this.dungeonManager = new DungeonManager(this.options.dataPath!, {
      logBattles: true,
      maxTurnsPerBattle: this.options.maxTurnsPerBattle!,
      exportCombatData: this.options.exportCombatData!,
      combatDataOutputDir: this.options.combatDataOutputDir!,
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
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(chalk.red('❌ Failed to initialize game:'), ErrorHandler.getUserFriendlyMessage(err));
      throw new DataLoadError(`Game initialization failed: ${err.message}`);
    }
  }

  async runAdventure(): Promise<void> {
    try {
      console.log(chalk.yellow('🚀 Starting Adventure!\n'));

      // Load party from specified file or default
      let party: any[];
      if (this.options.partyFile && this.options.partyFile !== 'party.json') {
        // Load custom party file
        party = await this.dataLoader.loadPartyFile(this.options.partyFile);
      } else {
        // Load default party
        const data = await this.dataLoader.validateDataIntegrity();
        party = data.party;
      }

      if (!party || party.length === 0) {
        throw new DataLoadError('No party members found in data files');
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
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(chalk.red('\n❌ Adventure failed:'), ErrorHandler.getUserFriendlyMessage(err));
      throw err;
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
      // Validar entrada
      if (!dungeonFile || typeof dungeonFile !== 'string') {
        throw new ValidationError('Dungeon file path must be a non-empty string');
      }

      console.log(chalk.yellow(`🏰 Loading custom dungeon: ${dungeonFile}\n`));

      let party = customParty;
      if (!party) {
        if (this.options.partyFile && this.options.partyFile !== 'party.json') {
          // Load custom party file
          party = await this.dataLoader.loadPartyFile(this.options.partyFile);
        } else {
          // Load default party
          const data = await this.dataLoader.validateDataIntegrity();
          party = data.party;
        }
      }

      if (!party || party.length === 0) {
        throw new DataLoadError('No party members available');
      }

      // Validar miembros del party
      for (let i = 0; i < party.length; i++) {
        const member = party[i];
        if (!member || typeof member !== 'object') {
          throw new ValidationError(`Invalid party member at index ${i}`);
        }
        if (!member.name || typeof member.name !== 'string') {
          throw new ValidationError(`Party member ${i} must have a valid name`);
        }
      }

      const progress = await this.dungeonManager.executeDungeon(dungeonFile, party);
      this.displayResults(progress);

      if (this.options.generateReport) {
        await this.generateReport(progress);
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(chalk.red('❌ Custom dungeon failed:'), ErrorHandler.getUserFriendlyMessage(err));
      throw err;
    }
  }

  getGameStatistics(): any {
    const progress = this.dungeonManager.getCurrentProgress();
    return progress ? this.dungeonManager.getDungeonStatistics() : null;
  }

  async listAvailableContent(): Promise<void> {
    try {
      console.log(chalk.cyan('📋 Available Content:\n'));

      // List dungeons
      console.log(chalk.yellow('🏰 Available Dungeons:'));
      const dungeonFiles = await this.getAvailableDungeons();
      dungeonFiles.forEach(dungeon => {
        const isDefault = dungeon === 'dungeon_01.json';
        const marker = isDefault ? chalk.green(' (default)') : '';
        console.log(`  • ${dungeon}${marker}`);
      });

      console.log();

      // List parties
      console.log(chalk.yellow('👥 Available Parties:'));
      const partyFiles = await this.getAvailableParties();
      partyFiles.forEach((party: string) => {
        const isDefault = party === 'party.json';
        const marker = isDefault ? chalk.green(' (default)') : '';
        console.log(`  • ${party}${marker}`);
      });

      console.log();

      // Show current configuration
      console.log(chalk.yellow('⚙️ Current Configuration:'));
      console.log(`  Data Path: ${this.options.dataPath}`);
      console.log(`  Default Dungeon: ${this.options.dungeonFile}`);
      console.log(`  Default Party: ${this.options.partyFile}`);
      console.log(`  Log Level: ${this.options.logLevel}`);
      console.log(`  Colors: ${this.options.useColors ? 'Enabled' : 'Disabled'}`);
      console.log(`  Compact Mode: ${this.options.compactMode ? 'Yes' : 'No'}`);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(chalk.red('❌ Failed to list content:'), ErrorHandler.getUserFriendlyMessage(err));
      throw new DataLoadError(`Failed to list available content: ${err.message}`);
    }
  }

  private async getAvailableDungeons(): Promise<string[]> {
    try {
      const fs = require('fs').promises;
      const dataPath = this.options.dataPath!;
      const files = await fs.readdir(dataPath);
      return files.filter((file: string) => file.startsWith('dungeon_') && file.endsWith('.json'));
    } catch {
      return ['dungeon_01.json', 'dungeon_02.json']; // Fallback
    }
  }

  private async getAvailableParties(): Promise<string[]> {
    try {
      const fs = require('fs').promises;
      const dataPath = this.options.dataPath!;
      const files = await fs.readdir(dataPath);
      return files.filter((file: string) => file.includes('party') && file.endsWith('.json'));
    } catch {
      return ['party.json']; // Fallback
    }
  }

  updateGameOptions(newOptions: Partial<GameOptions>): void {
    this.options = { ...this.options, ...newOptions };

    // Update dungeon manager settings
    this.dungeonManager.updateSettings({
      maxTurnsPerBattle: this.options.maxTurnsPerBattle!,
      exportCombatData: this.options.exportCombatData!,
      combatDataOutputDir: this.options.combatDataOutputDir!
    });

    // Update logger configuration
    this.dungeonManager.updateLoggerConfig({
      logLevel: this.options.logLevel!,
      useColors: this.options.useColors!,
      compactMode: this.options.compactMode!
    });
  }

  async runInteractiveMode(): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query: string): Promise<string> => {
      return new Promise(resolve => rl.question(query, resolve));
    };

    try {
      console.log(chalk.cyan('🎮 Interactive Mode - Auto-RPG Game\n'));

      // Show available content
      await this.listAvailableContent();
      console.log();

      // Ask for dungeon selection
      const dungeonAnswer = await question('🏰 Which dungeon would you like to play? (press Enter for default): ');
      if (dungeonAnswer.trim()) {
        this.options.dungeonFile = dungeonAnswer.trim();
      }

      // Ask for log level
      const logLevelAnswer = await question('📊 Log level (INFO, DEBUG, VERBOSE)? (press Enter for INFO): ');
      if (logLevelAnswer.trim()) {
        this.options.logLevel = logLevelAnswer.trim().toUpperCase() as any;
      }

      // Ask for compact mode
      const compactAnswer = await question('🎯 Use compact mode? (y/N): ');
      this.options.compactMode = compactAnswer.trim().toLowerCase() === 'y';

      // Ask for max turns
      const turnsAnswer = await question('⏰ Max turns per battle? (press Enter for 100): ');
      if (turnsAnswer.trim()) {
        const turns = parseInt(turnsAnswer.trim());
        if (isNaN(turns) || turns <= 0) {
          throw new ValidationError('Max turns must be a positive number');
        }
        this.options.maxTurnsPerBattle = turns;
      }

      // Ask for combat data export
      const exportAnswer = await question('🎬 Export combat data for animations? (y/N): ');
      this.options.exportCombatData = exportAnswer.trim().toLowerCase() === 'y';

      console.log(chalk.green('\n✅ Configuration updated. Starting game...\n'));

      rl.close();

      // Update settings and run
      this.updateGameOptions(this.options);
      await this.runAdventure();

    } catch (error) {
      console.error(chalk.red('❌ Interactive mode failed:'), error);
      rl.close();
    }
  }
}

// CLI interface
async function runCLI(): Promise<void> {
  const args = process.argv.slice(2);

  // Validar argumentos básicos
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const options: GameOptions = {
    dataPath: getArgValue(args, '--data-path') || './data',
    dungeonFile: getArgValue(args, '--dungeon') || 'dungeon_01.json',
    partyFile: getArgValue(args, '--party') || 'party.json',
    logLevel: (getArgValue(args, '--log-level') as any) || 'INFO',
    useColors: !args.includes('--no-colors'),
    compactMode: args.includes('--compact'),
    maxTurnsPerBattle: parseInt(getArgValue(args, '--max-turns') || '100'),
    generateReport: !args.includes('--no-report'),
    reportFormat: (getArgValue(args, '--report-format') as any) || 'text',
    saveReport: args.includes('--save-report'),
    exportCombatData: args.includes('--export-combat-data'),
    combatDataOutputDir: getArgValue(args, '--combat-data-dir') || './combat-animations',
    interactive: args.includes('--interactive'),
    listMode: args.includes('--list')
  };

  // Validar opciones
  if ((options.maxTurnsPerBattle ?? 100) <= 0 || isNaN(options.maxTurnsPerBattle ?? 100)) {
    console.error(chalk.red('❌ Error: --max-turns must be a positive number'));
    process.exit(1);
  }

  const validLogLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'];
  if (!validLogLevels.includes(options.logLevel ?? 'INFO')) {
    console.error(chalk.red(`❌ Error: Invalid log level '${options.logLevel}'. Valid levels: ${validLogLevels.join(', ')}`));
    process.exit(1);
  }

  const validReportFormats = ['text', 'json', 'html', 'markdown'];
  if (!validReportFormats.includes(options.reportFormat ?? 'text')) {
    console.error(chalk.red(`❌ Error: Invalid report format '${options.reportFormat}'. Valid formats: ${validReportFormats.join(', ')}`));
    process.exit(1);
  }

  try {
    const game = new AutoRPGGame(options);
    await game.initialize();

    if (options.listMode) {
      await game.listAvailableContent();
      return;
    }

    if (options.interactive) {
      await game.runInteractiveMode();
      return;
    }

    const customDungeon = getArgValue(args, '--custom-dungeon');
    if (customDungeon) {
      await game.playCustomDungeon(customDungeon);
    } else {
      await game.runAdventure();
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(chalk.red('\n💥 Game crashed:'), ErrorHandler.getUserFriendlyMessage(err));
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
  --party <file>               Party file to use (default: party.json)
  --custom-dungeon <file>      Play a specific dungeon file
  --log-level <level>          Log level: ERROR, WARN, INFO, DEBUG, VERBOSE (default: INFO)
  --no-colors                  Disable colored output
  --compact                    Use compact logging mode
  --max-turns <number>         Maximum turns per battle (default: 100)
  --no-report                  Skip report generation
  --report-format <format>     Report format: text, json, html, markdown (default: text)
  --save-report               Save report to file instead of displaying
  --export-combat-data        Export combat data to JSON files for animation
  --combat-data-dir <dir>     Directory for combat data export (default: ./combat-animations)
  --interactive               Run in interactive mode for configuration
  --list                      List available dungeons and parties
  --help, -h                   Show this help message

EXAMPLES:
  npm start                                    # Run with default settings
  npm start -- --dungeon dungeon_02.json      # Play specific dungeon
  npm start -- --compact --no-colors          # Minimal logging
  npm start -- --log-level DEBUG --save-report # Debug mode with saved report
  npm start -- --custom-dungeon my_dungeon.json # Play custom dungeon
  npm start -- --export-combat-data # Export combat data for animations
  npm start -- --list                       # List available content
  npm start -- --interactive                # Interactive configuration

FEATURES:
  ⚔️  Automated turn-based combat
  🏰 Multi-battle dungeon exploration
  📊 Detailed battle analysis and reporting
  🎨 Colorized console output
  ⚙️  Configurable game settings
  💾 Save/load dungeon progress
  📈 Battle statistics and performance metrics
  🎬 Combat data export for animations
  🎯 Interactive configuration mode
  📋 Content listing and discovery
`));
}

// Export for programmatic use
export { AutoRPGGame, GameOptions };

// Run CLI if this file is executed directly
if (require.main === module) {
  runCLI();
}