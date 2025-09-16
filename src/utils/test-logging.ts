import { BattleLogger } from './BattleLogger';
import { ReportGenerator } from './ReportGenerator';
import { DungeonManager } from '../systems/DungeonManager';
import { DataLoader } from '../loaders';
import { join } from 'path';

async function testBattleLogger() {
  console.log('📝 Testing Battle Logger...\n');

  // Test different log levels
  console.log('Testing different log levels:');

  const logger = new BattleLogger({
    useColors: true,
    logLevel: 'VERBOSE',
    showTimestamps: false,
    showTurnNumbers: true,
    showParticipantStats: true,
    compactMode: false
  });

  logger.logError('TEST', 'This is an error message');
  logger.logWarning('TEST', 'This is a warning message');
  logger.log('INFO', 'TEST', 'This is an info message');
  logger.logDebug('TEST', 'This is a debug message');
  logger.logVerbose('TEST', 'This is a verbose message');

  console.log('\n📊 Log Statistics:');
  const stats = logger.getLogStatistics();
  console.log(`Total logs: ${stats.totalLogs}`);
  console.log('By level:', stats.byLevel);
  console.log('By category:', stats.byCategory);

  console.log('\n💾 Exported logs preview:');
  const exported = logger.exportLogs();
  console.log(exported.split('\n').slice(0, 3).join('\n') + '...');

  logger.clearLogs();
  console.log(`\nLogs cleared. New count: ${logger.getLogStatistics().totalLogs}`);
}

async function testCompactLogging() {
  console.log('\n\n🎮 Testing Compact Battle Logging...\n');

  try {
    const dataPath = join(__dirname, '../../data');
    const loader = new DataLoader(dataPath);
    const { skills, jobs, enemies, party } = await loader.validateDataIntegrity();

    // Create a logger with compact mode
    const logger = new BattleLogger({
      useColors: true,
      logLevel: 'INFO',
      compactMode: true,
      showDamageNumbers: true
    });

    // Override console.log to capture logs
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    // Run a quick battle with logging
    const dungeonManager = new DungeonManager(dataPath, {
      logBattles: true,
      maxTurnsPerBattle: 20
    });

    await dungeonManager.initialize();

    // Simulate a single battle with custom logging
    console.log('Running battle with compact logging...');

    const progress = await dungeonManager.executeDungeon('dungeon_01.json', party);

    // Restore console.log
    console.log = originalLog;

    console.log(`\n✅ Battle completed. Captured ${logs.length} log entries`);
    console.log('Sample logs:');
    logs.slice(0, 5).forEach(log => console.log(`  ${log}`));

  } catch (error) {
    console.error('❌ Compact logging test failed:', error);
  }
}

async function testReportGeneration() {
  console.log('\n\n📊 Testing Report Generation...\n');

  try {
    const dataPath = join(__dirname, '../../data');

    // Create a dungeon manager with minimal logging
    const dungeonManager = new DungeonManager(dataPath, {
      logBattles: false,
      maxTurnsPerBattle: 30
    });

    await dungeonManager.initialize();

    const loader = new DataLoader(dataPath);
    const { party } = await loader.validateDataIntegrity();

    console.log('Running dungeon for report analysis...');
    const progress = await dungeonManager.executeDungeon('dungeon_01.json', party);

    console.log('\nGenerating analysis...');
    const analysis = ReportGenerator.analyzeDungeon(progress);

    console.log('📋 Analysis Summary:');
    console.log(`  Dungeon ID: ${analysis.dungeonId}`);
    console.log(`  Total Duration: ${Math.round(analysis.totalDuration)}s`);
    console.log(`  Battles: ${analysis.battlesWon}W/${analysis.battlesLost}L`);
    console.log(`  Total Damage: ${analysis.totalDamage}`);
    console.log(`  Total Healing: ${analysis.totalHealing}`);
    console.log(`  Avg Turns per Battle: ${Math.round(analysis.avgTurnsPerBattle * 10) / 10}`);

    console.log('\n👥 Party Performance:');
    analysis.partyPerformance.forEach(member => {
      const status = member.survived ? '✅' : '💀';
      console.log(`  ${status} ${member.name}: ${member.totalDamageDealt} dmg, ${member.totalHealingDone} heal`);
    });

    console.log('\n🎯 Top Skills:');
    analysis.mostUsedSkills.slice(0, 3).forEach((skill, index) => {
      console.log(`  ${index + 1}. ${skill.skill.replace(/_/g, ' ')}: ${skill.uses} uses`);
    });

    // Generate different report formats
    console.log('\n📄 Generating reports in different formats...');

    const textReport = ReportGenerator.generateReport(analysis, 'text');
    console.log('\nText Report (first 5 lines):');
    textReport.split('\n').slice(0, 5).forEach(line => console.log(`  ${line}`));

    const markdownReport = ReportGenerator.generateReport(analysis, 'markdown');
    console.log('\nMarkdown Report (first 5 lines):');
    markdownReport.split('\n').slice(0, 5).forEach(line => console.log(`  ${line}`));

    const jsonReport = ReportGenerator.generateReport(analysis, 'json');
    console.log('\nJSON Report size:', jsonReport.length, 'characters');

    const htmlReport = ReportGenerator.generateReport(analysis, 'html');
    console.log('HTML Report size:', htmlReport.length, 'characters');

    console.log('\n✅ All report formats generated successfully');

  } catch (error) {
    console.error('❌ Report generation test failed:', error);
  }
}

async function testBattleAnalysis() {
  console.log('\n\n🔍 Testing Individual Battle Analysis...\n');

  try {
    const dataPath = join(__dirname, '../../data');
    const dungeonManager = new DungeonManager(dataPath, { logBattles: false });
    await dungeonManager.initialize();

    const loader = new DataLoader(dataPath);
    const { party } = await loader.validateDataIntegrity();

    // Run just one battle
    const singleParty = [party[0]!, party[1]!]; // Take first 2 members
    const progress = await dungeonManager.startDungeon('dungeon_01.json', singleParty);

    // Execute only first battle
    console.log('Executing single battle for detailed analysis...');
    const dungeon = await loader.loadDungeon('dungeon_01.json');

    if (progress.battleHistory.length > 0) {
      const battleHistory = progress.battleHistory[0]!;
      const battleAnalysis = ReportGenerator.analyzeBattle(battleHistory, 1);

      console.log('⚔️ Battle Analysis:');
      console.log(`  Duration: ${battleAnalysis.duration} turns`);
      console.log(`  Outcome: ${battleAnalysis.outcome}`);
      console.log(`  Damage Dealt: ${battleAnalysis.damageDealt}`);
      console.log(`  Healing Done: ${battleAnalysis.healingDone}`);

      console.log('\n📊 Skills Used:');
      Object.entries(battleAnalysis.skillsUsed).forEach(([skill, count]) => {
        console.log(`  ${skill.replace(/_/g, ' ')}: ${count} times`);
      });

      console.log('\n👤 Participant Performance:');
      battleAnalysis.participantPerformance.forEach(perf => {
        const team = perf.isEnemy ? '🔴' : '🔵';
        const status = perf.survived ? '✅' : '💀';
        console.log(`  ${team} ${status} ${perf.name}:`);
        console.log(`     Damage Dealt: ${perf.damageDealt}`);
        console.log(`     Damage Taken: ${perf.damageTaken}`);
        console.log(`     Healing Done: ${perf.healingDone}`);
        console.log(`     Skills Used: ${perf.skillsUsed}`);
      });
    }

  } catch (error) {
    console.error('❌ Battle analysis test failed:', error);
  }
}

async function testLoggerConfigurations() {
  console.log('\n\n⚙️ Testing Logger Configurations...\n');

  const configs = [
    { name: 'Minimal', config: { logLevel: 'ERROR' as const, compactMode: true, useColors: false } },
    { name: 'Standard', config: { logLevel: 'INFO' as const, compactMode: false, useColors: true } },
    { name: 'Verbose', config: { logLevel: 'VERBOSE' as const, showTimestamps: true, useColors: true } },
    { name: 'Debug', config: { logLevel: 'DEBUG' as const, showParticipantStats: true, useColors: true } }
  ];

  configs.forEach(({ name, config }) => {
    console.log(`\n${name} Configuration:`);
    const logger = new BattleLogger(config);

    console.log(`Config: ${JSON.stringify(logger.getConfig(), null, 2)}`);

    logger.logError('TEST', 'Error message');
    logger.logWarning('TEST', 'Warning message');
    logger.log('INFO', 'TEST', 'Info message');
    logger.logDebug('TEST', 'Debug message');
    logger.logVerbose('TEST', 'Verbose message');

    const stats = logger.getLogStatistics();
    console.log(`Logs captured: ${stats.totalLogs}`);
  });
}

async function runAllLoggingTests() {
  try {
    console.log('🚀 Running Logging and Reporting Tests\n');

    await testBattleLogger();
    await testCompactLogging();
    await testReportGeneration();
    await testBattleAnalysis();
    await testLoggerConfigurations();

    console.log('\n🎉 All logging and reporting tests completed!');
  } catch (error) {
    console.error('❌ Logging tests failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllLoggingTests();
}

export { runAllLoggingTests as testLogging };