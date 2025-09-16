import { BattleSystem } from './src/systems/BattleSystem';
import { EntityFactory } from './src/loaders/EntityFactory';
import { DataLoader } from './src/loaders/DataLoader';
import { BattleLogger } from './src/utils/BattleLogger';

async function testEnhancedSkillsSystem() {
  console.log('=== Testing Enhanced Skills System ===\n');

  // Load data
  const dataLoader = new DataLoader('./data');

  const [skills, jobs, enemyTemplates] = await Promise.all([
    dataLoader.loadSkills(),
    dataLoader.loadJobs(),
    dataLoader.loadEnemies()
  ]);

  const entityFactory = new EntityFactory(skills, jobs, enemyTemplates);

  // Create test party with characters that have enhanced skills
  const party = [
    {
      name: 'Warrior',
      job: 'Warrior',
      level: 5,
      rules: [
        {
          priority: 10,
          condition: 'always',
          target: 'weakestEnemy',
          action: 'cast:earthquake'
        }
      ]
    },
    {
      name: 'Mage',
      job: 'BlackMage',
      level: 5,
      rules: [
        {
          priority: 10,
          condition: 'always',
          target: 'weakestEnemy',
          action: 'cast:chain_lightning'
        }
      ]
    }
  ];

  // Create test enemies
  const battleEnemies = [
    { type: 'Slime', name: 'Slime A' },
    { type: 'Goblin', name: 'Goblin A' }
  ];

  // Create battle system
  const logger = new BattleLogger();
  const battleSystem = new BattleSystem(logger);

  // Create entities
  const allies = party.map(member => entityFactory.createCharacter(member));
  const enemyInstances = entityFactory.createEnemiesFromBattle(battleEnemies, 3);

  console.log('=== Initial Party Status ===');
  allies.forEach((ally: any) => {
    console.log(`${ally.name} (Level ${ally.level}):`);
    console.log(`  HP: ${ally.currentStats.hp}/${ally.maxStats.hp}`);
    console.log(`  MP: ${ally.currentStats.mp}/${ally.maxStats.mp}`);
    console.log(`  Abilities: ${ally.abilities.map((a: any) => a.name).join(', ')}`);
    console.log(`  Active Cooldowns: ${ally.skillCooldowns.length}`);
    console.log();
  });

  console.log('=== Initial Enemy Status ===');
  enemyInstances.forEach((enemy: any) => {
    console.log(`${enemy.name}:`);
    console.log(`  HP: ${enemy.currentStats.hp}/${enemy.maxStats.hp}`);
    console.log(`  MP: ${enemy.currentStats.mp}/${enemy.maxStats.mp}`);
    console.log(`  Abilities: ${enemy.abilities.map((a: any) => a.name).join(', ')}`);
    console.log(`  Active Cooldowns: ${enemy.skillCooldowns.length}`);
    console.log();
  });

  // Initialize battle
  const battleState = battleSystem.initializeBattle(allies, enemyInstances);
  console.log('=== Battle Initialized ===');
  console.log(`Turn: ${battleState.turnNumber}`);
  console.log(`Allies: ${battleState.allies.length}, Enemies: ${battleState.enemies.length}`);
  console.log();

  // Execute a few turns to test cooldown system
  let turnCount = 0;
  const maxTurns = 5;

  while (!battleSystem.isBattleComplete() && turnCount < maxTurns) {
    turnCount++;
    console.log(`=== Turn ${turnCount} ===`);

    const turnResult = battleSystem.executeTurn();

    if (turnResult) {
      console.log(`Action: ${turnResult.message}`);

      if (turnResult.damage) {
        console.log(`Damage: ${turnResult.damage}`);
      }

      if (turnResult.heal) {
        console.log(`Heal: ${turnResult.heal}`);
      }
    }

    // Show current status
    const status = battleSystem.getParticipantStatus();
    console.log('Current Status:');
    status.forEach(s => {
      console.log(`  ${s.participant.name}: ${s.hpPercent}% HP, ${s.mpPercent}% MP, ${s.activeCooldowns} cooldowns`);
    });

    console.log();
  }

  // Show final result
  const result = battleSystem.getBattleResult();
  if (result) {
    console.log('=== Battle Result ===');
    console.log(`Victory: ${result.victory}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Turns: ${result.turns}`);
    console.log(`Surviving Allies: ${result.survivingAllies.length}`);
    console.log(`Defeated Enemies: ${result.defeatedEnemies.length}`);
  }

  console.log('\n=== Test Completed ===');
}

// Run the test
testEnhancedSkillsSystem().catch(console.error);