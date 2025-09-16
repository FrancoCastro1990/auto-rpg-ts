import { DungeonManager } from './DungeonManager';
import { DataLoader } from '../loaders';
import { join } from 'path';

async function testDungeonManager() {
  console.log('🏰 Testing Dungeon Manager...\n');

  try {
    const dataPath = join(__dirname, '../../data');
    const dungeonManager = new DungeonManager(dataPath, {
      recovery: {
        hpRecoveryPercent: 30,
        mpRecoveryPercent: 60,
        fullRecoveryOnBossVictory: true
      },
      maxTurnsPerBattle: 50,
      logBattles: true
    });

    // Initialize the dungeon manager
    console.log('⚙️ Initializing dungeon manager...');
    await dungeonManager.initialize();

    // Load party from data
    const loader = new DataLoader(dataPath);
    const { party } = await loader.validateDataIntegrity();

    console.log('✅ Dungeon manager initialized\n');

    // Execute full dungeon
    console.log('🚀 Starting dungeon execution...\n');
    const progress = await dungeonManager.executeDungeon('dungeon_01.json', party);

    console.log('\n📊 FINAL RESULTS:');
    console.log(`Dungeon completed: ${progress.isComplete ? 'Yes' : 'No'}`);
    console.log(`Victory: ${progress.isVictorious ? 'Yes' : 'No'}`);
    console.log(`Battles completed: ${progress.completedBattles.length}`);
    console.log(`Total turns: ${progress.totalTurns}`);

    // Display detailed report
    console.log('\n' + dungeonManager.getDetailedReport());

    // Display statistics
    const stats = dungeonManager.getDungeonStatistics();
    console.log('\n📈 STATISTICS:');
    console.log(`Total battles: ${stats.totalBattles}`);
    console.log(`Victories: ${stats.victoriesBattles}/${stats.totalBattles}`);
    console.log(`Average turns per battle: ${stats.averageTurnsPerBattle}`);
    console.log(`Total damage dealt: ${stats.totalDamageDealt}`);
    console.log(`Total healing done: ${stats.totalHealingDone}`);
    console.log(`Party deaths: ${stats.partyDeaths}`);

    return progress;

  } catch (error) {
    console.error('❌ Dungeon test failed:', error);
    throw error;
  }
}

async function testSaveLoadProgress() {
  console.log('\n\n💾 Testing Save/Load Progress...\n');

  try {
    const dataPath = join(__dirname, '../../data');
    const dungeonManager = new DungeonManager(dataPath, {
      logBattles: false,
      allowSaveState: true
    });

    await dungeonManager.initialize();

    const loader = new DataLoader(dataPath);
    const { party } = await loader.validateDataIntegrity();

    // Start dungeon and complete first battle
    const progress = await dungeonManager.startDungeon('dungeon_01.json', party);

    // Simulate partial progress
    console.log('⚡ Simulating partial dungeon progress...');

    // Save progress
    const saveData = dungeonManager.saveProgress();
    console.log('✅ Progress saved');

    if (saveData) {
      // Create new manager and load progress
      const newManager = new DungeonManager(dataPath, { logBattles: false });
      await newManager.initialize();

      console.log('⏳ Loading saved progress...');
      const loadedProgress = await newManager.loadProgress(saveData);

      console.log('✅ Progress loaded successfully');
      console.log(`   Dungeon ID: ${loadedProgress.dungeonId}`);
      console.log(`   Current battle: ${loadedProgress.currentBattleIndex + 1}`);
      console.log(`   Completed battles: ${loadedProgress.completedBattles.length}`);

      // Continue from saved state
      console.log('\n▶️ Continuing from saved state...');
      const finalProgress = await newManager.executeDungeon('dungeon_01.json');

      console.log(`\n✅ Dungeon completion: ${finalProgress.isVictorious ? 'Victory' : 'Defeat'}`);
    }

  } catch (error) {
    console.error('❌ Save/Load test failed:', error);
    throw error;
  }
}

async function testDungeonSettings() {
  console.log('\n\n⚙️ Testing Dungeon Settings...\n');

  try {
    const dataPath = join(__dirname, '../../data');

    // Test with different recovery settings
    const customSettings = {
      recovery: {
        hpRecoveryPercent: 50,
        mpRecoveryPercent: 80,
        fullRecoveryOnBossVictory: false
      },
      maxTurnsPerBattle: 30,
      logBattles: false
    };

    const dungeonManager = new DungeonManager(dataPath, customSettings);
    await dungeonManager.initialize();

    console.log('Settings applied:');
    const settings = dungeonManager.getSettings();
    console.log(`  HP Recovery: ${settings.recovery.hpRecoveryPercent}%`);
    console.log(`  MP Recovery: ${settings.recovery.mpRecoveryPercent}%`);
    console.log(`  Full recovery on boss victory: ${settings.recovery.fullRecoveryOnBossVictory}`);
    console.log(`  Max turns per battle: ${settings.maxTurnsPerBattle}`);

    const loader = new DataLoader(dataPath);
    const { party } = await loader.validateDataIntegrity();

    console.log('\n🏃‍♂️ Running dungeon with custom settings...');
    const progress = await dungeonManager.executeDungeon('dungeon_01.json', party);

    console.log(`Result: ${progress.isVictorious ? '✅ Victory' : '❌ Defeat'}`);

  } catch (error) {
    console.error('❌ Settings test failed:', error);
    throw error;
  }
}

async function testDungeonEdgeCases() {
  console.log('\n\n🧪 Testing Edge Cases...\n');

  try {
    const dataPath = join(__dirname, '../../data');

    // Test with very limited turns
    console.log('Test 1: Very limited turns per battle');
    const limitedTurnsManager = new DungeonManager(dataPath, {
      maxTurnsPerBattle: 5,
      logBattles: false
    });

    await limitedTurnsManager.initialize();

    const loader = new DataLoader(dataPath);
    const { party } = await loader.validateDataIntegrity();

    const limitedResult = await limitedTurnsManager.executeDungeon('dungeon_01.json', party);
    console.log(`   Result: ${limitedResult.isVictorious ? 'Victory' : 'Defeat'} (likely timeout)`);

    // Test with no recovery
    console.log('\nTest 2: No recovery between battles');
    const noRecoveryManager = new DungeonManager(dataPath, {
      recovery: {
        hpRecoveryPercent: 0,
        mpRecoveryPercent: 0,
        fullRecoveryOnBossVictory: false
      },
      logBattles: false
    });

    await noRecoveryManager.initialize();
    const noRecoveryResult = await noRecoveryManager.executeDungeon('dungeon_01.json', party);
    console.log(`   Result: ${noRecoveryResult.isVictorious ? 'Victory' : 'Defeat'} (no healing)`);

  } catch (error) {
    console.error('❌ Edge cases test failed:', error);
  }
}

async function runAllDungeonTests() {
  try {
    console.log('🚀 Running Dungeon Manager Tests\n');

    await testDungeonManager();
    await testSaveLoadProgress();
    await testDungeonSettings();
    await testDungeonEdgeCases();

    console.log('\n🎉 All dungeon manager tests completed!');
  } catch (error) {
    console.error('❌ Dungeon tests failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllDungeonTests();
}

export { runAllDungeonTests as testDungeonManager };