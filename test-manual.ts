import { DataLoader, EntityFactory } from './src/loaders';
import { BattleSystem } from './src/systems';
import { join } from 'path';

async function quickTest() {
  console.log('🧪 Quick Test - RPG Auto-Battler\n');

  try {
    const dataPath = join(__dirname, 'data');
    const loader = new DataLoader(dataPath);

    console.log('📋 Loading game data...');
    const { skills, jobs, enemies, party } = await loader.validateDataIntegrity();
    const factory = new EntityFactory(skills, jobs, enemies);

    console.log(`✅ Loaded: ${skills.length} skills, ${jobs.length} jobs, ${enemies.length} enemies, ${party.length} party members\n`);

    // Crear party
    console.log('👥 Creating party...');
    const characters = party.map(member => {
      const character = factory.createCharacter(member);
      console.log(`  - ${character.name} (${character.job}): ${character.currentStats.hp} HP, ${character.currentStats.mp} MP`);
      return character;
    });

    // Crear enemigos para batalla de prueba
    console.log('\n🐉 Creating test enemies...');
    const battleEnemies = factory.createEnemiesFromBattle([
      { type: 'Goblin', name: 'Goblin Scout' },
      { type: 'Orc', name: 'Orc Warrior' },
       { type: 'Orc', name: 'Orc Warrior' },
        { type: 'Orc', name: 'Orc Warrior' },
    ]);

    battleEnemies.forEach(enemy => {
      console.log(`  - ${enemy.name} (${enemy.type}): ${enemy.currentStats.hp} HP, ${enemy.currentStats.mp} MP`);
    });

    // Batalla rápida
    console.log('\n⚔️ Starting quick battle...');
    const battle = new BattleSystem();
    battle.initializeBattle(characters, battleEnemies);

    console.log('\nTurn order:');
    const battleState = battle.getBattleState();
    if (battleState) {
      battleState.turnOrder.forEach((turn, index) => {
        const teamIcon = turn.participant.isEnemy ? '🔴' : '🔵';
        console.log(`  ${index + 1}. ${teamIcon} ${turn.participant.name} (SPD: ${turn.speed}, Initiative: ${turn.initiative})`);
      });
    }

    console.log('\n🎮 Simulating battle...');
    const result = battle.simulateFullBattle(30);

    console.log(`\n🏁 Battle Result: ${result.victory ? '🎉 VICTORY!' : '💀 DEFEAT'}`);
    console.log(`   Turns: ${result.turns}`);
    console.log(`   Reason: ${result.reason}`);

    console.log('\n📊 Final Status:');
    console.log('Surviving allies:');
    result.survivingAllies.forEach(ally => {
      console.log(`  ✅ ${ally.name}: ${ally.currentStats.hp}/${ally.maxStats.hp} HP`);
    });

    console.log('Defeated enemies:');
    result.defeatedEnemies.forEach(enemy => {
      console.log(`  💀 ${enemy.name} (${enemy.type})`);
    });

    // Test con boss
    console.log('\n\n🔥 BOSS BATTLE TEST');
    const bossEnemies = factory.createEnemiesFromBattle([
      { type: 'ShadowLord', name: 'Shadow Lord Boss' }
    ]);

    // Crear party fresca para boss
    const freshParty = party.map(member => factory.createCharacter(member));

    console.log(`\n👑 Boss: ${bossEnemies[0]!.name} (HP: ${bossEnemies[0]!.currentStats.hp})`);

    const bossBattle = new BattleSystem();
    bossBattle.initializeBattle(freshParty, bossEnemies);

    const bossResult = bossBattle.simulateFullBattle(50);

    console.log(`\n🏆 Boss Battle Result: ${bossResult.victory ? '🎉 VICTORY!' : '💀 DEFEAT'}`);
    console.log(`   Turns: ${bossResult.turns}`);
    console.log(`   ${bossResult.reason}`);

    if (bossResult.victory) {
      console.log('\n🎊 Congratulations! The party defeated the Shadow Lord!');
    } else {
      console.log('\n😵 The Shadow Lord proved too powerful...');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Función adicional para test de dungeon loading
async function testDungeonLoading() {
  console.log('\n\n🏰 DUNGEON LOADING TEST');

  try {
    const dataPath = join(__dirname, 'data');
    const loader = new DataLoader(dataPath);

    const dungeon = await loader.loadDungeon('dungeon_01.json');

    console.log(`📖 Dungeon: ${dungeon.name}`);
    console.log(`📝 Description: ${dungeon.description}`);
    console.log(`⚔️ Total battles: ${dungeon.battles.length}`);

    dungeon.battles.forEach((battle, index) => {
      const enemyList = battle.enemies.map(e => e.name || e.type).join(', ');
      const battleType = battle.enemies.some(e => e.type === 'ShadowLord') ? ' 👑 (BOSS BATTLE)' : '';
      console.log(`  ${index + 1}. Battle ${battle.id}: ${enemyList}${battleType}`);
    });

  } catch (error) {
    console.error('❌ Dungeon loading failed:', error);
  }
}

async function runAllQuickTests() {
  await quickTest();
  await testDungeonLoading();
  console.log('\n✨ All quick tests completed!\n');
}

if (require.main === module) {
  runAllQuickTests();
}

export { runAllQuickTests };