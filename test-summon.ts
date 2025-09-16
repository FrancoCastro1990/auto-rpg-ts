import { BattleSystem } from './src/systems/BattleSystem';
import { EntityFactory } from './src/loaders/EntityFactory';
import { DataLoader } from './src/loaders/DataLoader';
import { BattleLogger } from './src/utils/BattleLogger';
import { TargetSelector } from './src/systems/TargetSelector';

async function testSummonSkill() {
  console.log('=== Testing Summon Skill Functionality ===\n');

  // Load data
  const dataLoader = new DataLoader('./data');
  const skills = await dataLoader.loadSkills();
  const jobs = await dataLoader.loadJobs();
  const enemies = await dataLoader.loadEnemies();

  // Create entity factory
  const entityFactory = new EntityFactory(skills, jobs, enemies);

  // Create battle logger
  const logger = new BattleLogger();

  // Create battle system with entity factory
  const battleSystem = new BattleSystem(logger, entityFactory);

  // Create a Necromancer (has summon_skeleton skill)
  const necromancer = entityFactory.createEnemy('Necromancer', 'Dark Summoner', 1);
  console.log(`Created Necromancer: ${necromancer.name}`);
  console.log(`Abilities: ${necromancer.abilities.map((a: any) => a.name).join(', ')}\n`);

  // Create a simple ally for the battle
  const ally = entityFactory.createCharacter({
    name: 'Hero',
    job: 'Warrior',
    level: 1,
    rules: [
      { priority: 10, condition: 'always', target: 'randomEnemy', action: 'attack' }
    ]
  });
  console.log(`Created Ally: ${ally.name}`);
  console.log(`Ally Rules: ${JSON.stringify(ally.rules, null, 2)}\n`);

  // Initialize battle
  const battleState = battleSystem.initializeBattle([ally], [necromancer]);
  console.log(`Initialized battle`);
  console.log(`Initial Allies: ${battleState.allies.map((a: any) => a.name).join(', ')}`);
  console.log(`Initial Enemies: ${battleState.enemies.map((e: any) => e.name).join(', ')}`);
  console.log(`Initial Turn Order: ${battleState.turnOrder.map((t: any) => t.participant.name).join(' -> ')}\n`);

  // Find summon skill
  const summonSkill = necromancer.abilities.find((a: any) => a.name === 'Summon Skeleton');
  if (!summonSkill) {
    console.error('Summon skill not found!');
    console.log('Available abilities:', necromancer.abilities.map((a: any) => `"${a.name}"`).join(', '));
    return;
  }

  console.log(`Found summon skill: ${summonSkill.name}`);
  console.log(`Effect: ${JSON.stringify(summonSkill.effect, null, 2)}\n`);

  // Debug Necromancer state
  console.log('Necromancer Debug Info:');
  console.log(`MP: ${necromancer.currentStats.mp}/${necromancer.maxStats.mp} (${Math.round((necromancer.currentStats.mp / necromancer.maxStats.mp) * 100)}%)`);
  console.log(`Rules: ${JSON.stringify(necromancer.rules, null, 2)}\n`);

  // Execute more turns to see minions in action
  console.log('\nContinuing battle to see minions fight...');
  let turnCount = 2; // Already did 2 turns
  const maxTurns = 15;

  while (!battleSystem.isBattleComplete() && turnCount < maxTurns) {
    turnCount++;
    const turnResult = battleSystem.executeTurn();

    if (turnResult) {
      console.log(`Turn ${turnCount}: ${turnResult.message}`);

      // Check if a skeleton is acting
      if (turnResult.actor.name.includes('Skeleton')) {
        console.log(`🦴 SKELETON ACTION: ${turnResult.actor.name} is fighting!`);
      }

      // Check current battle state periodically
      if (turnCount % 3 === 0) {
        const currentState = battleSystem.getBattleState();
        if (currentState) {
          const skeletons = currentState.enemies.filter((e: any) => e.name.includes('Skeleton'));
          console.log(`   Status: ${skeletons.length} skeletons active`);
          skeletons.forEach((skeleton: any, index: number) => {
            console.log(`     ${index + 1}. ${skeleton.name}: ${skeleton.currentStats.hp}/${skeleton.maxStats.hp} HP`);
          });
        }
      }
    } else {
      console.log(`Turn ${turnCount}: No action taken`);
    }
  }

  // Debug target selection
  console.log('\n=== DEBUG TARGET SELECTION ===');
  const currentState = battleSystem.getBattleState();
  if (currentState) {
    const livingAllies = currentState.allies.filter(a => a.isAlive);
    const livingEnemies = currentState.enemies.filter(e => e.isAlive);

    console.log(`Living Allies: ${livingAllies.map(a => a.name).join(', ')}`);
    console.log(`Living Enemies: ${livingEnemies.map(e => e.name).join(', ')}`);

    // Test target selection for necromancer
    const necromancerInBattle = livingEnemies.find(e => e.name === 'Dark Summoner');
    if (necromancerInBattle) {
      console.log(`\nTesting target selection for ${necromancerInBattle.name}:`);
      console.log(`Is Enemy: ${necromancerInBattle.isEnemy}`);

      const actorAllies = necromancerInBattle.isEnemy ? livingEnemies : livingAllies;
      const actorEnemies = necromancerInBattle.isEnemy ? livingAllies : livingEnemies;

      console.log(`Actor Allies: ${actorAllies.map(a => a.name).join(', ')}`);
      console.log(`Actor Enemies: ${actorEnemies.map(e => e.name).join(', ')}`);

      // Test random enemy selection
      const randomEnemyResult = TargetSelector.selectTarget('randomEnemy', necromancerInBattle, actorAllies, actorEnemies);
      console.log(`Random Enemy Target: ${randomEnemyResult.target?.name || 'null'} (${randomEnemyResult.reason})`);
    }
  }
  console.log('=== END DEBUG ===\n');

  // Final battle state
  const finalState = battleSystem.getBattleState();
  if (finalState) {
    console.log('\n=== Final Battle State ===');
    console.log(`Allies: ${finalState.allies.map((a: any) => a.name).join(', ')}`);
    console.log(`Enemies: ${finalState.enemies.map((e: any) => e.name).join(', ')}`);
    console.log(`Turn Order: ${finalState.turnOrder.map((t: any) => t.participant.name).join(' -> ')}`);

    const skeletons = finalState.enemies.filter((e: any) => e.name.includes('Skeleton'));
    console.log(`Total Skeletons: ${skeletons.length}`);
  }

  console.log('\n=== Summon Skill Test Complete ===');
}

// Run the test
testSummonSkill().catch(console.error);