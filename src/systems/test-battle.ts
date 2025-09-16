import { BattleSystem } from './BattleSystem';
import { TargetSelector } from './TargetSelector';
import { Character, EnemyInstance, BattleParticipant } from '../models/types';

function createMockCharacter(
  name: string,
  job: string,
  hp: number,
  mp: number,
  str: number,
  def: number,
  mag: number,
  spd: number
): Character {
  const stats = { hp, mp, str, def, mag, spd };
  return {
    id: `char_${name.toLowerCase()}`,
    name,
    job,
    level: 1,
    currentStats: { ...stats },
    maxStats: { ...stats },
    baseStats: { ...stats },
    abilities: [
      { name: 'Basic Attack', type: 'attack', effect: { damage: 10 }, mpCost: 0 },
      { name: 'Heal', type: 'heal', effect: { heal: 30 }, mpCost: 8 },
      { name: 'Power Strike', type: 'attack', effect: { damage: 25 }, mpCost: 5 }
    ],
    rules: [
      { priority: 100, condition: 'ally.hp < 30%', target: 'lowestHpAlly', action: 'cast:heal' },
      { priority: 50, condition: 'self.mp > 50%', target: 'weakestEnemy', action: 'cast:power_strike' },
      { priority: 10, condition: 'always', target: 'weakestEnemy', action: 'attack' }
    ],
    buffs: [],
    isAlive: true,
    isEnemy: false
  };
}

function createMockEnemy(
  name: string,
  type: string,
  hp: number,
  mp: number,
  str: number,
  def: number,
  mag: number,
  spd: number,
  isBoss: boolean = false
): EnemyInstance {
  const stats = { hp, mp, str, def, mag, spd };
  return {
    id: `enemy_${name.toLowerCase().replace(/\s+/g, '_')}`,
    name,
    type,
    job: `${type}Job`,
    currentStats: { ...stats },
    maxStats: { ...stats },
    baseStats: { ...stats },
    abilities: [
      { name: 'Basic Attack', type: 'attack', effect: { damage: 8 }, mpCost: 0 }
    ],
    rules: [
      { priority: 10, condition: 'always', target: 'randomAlly', action: 'attack' }
    ],
    buffs: [],
    isAlive: true,
    isEnemy: true,
    isBoss
  };
}

async function testTargetSelector() {
  console.log('🎯 Testing Target Selector...\n');

  const warrior = createMockCharacter('Kael', 'Warrior', 120, 20, 15, 12, 5, 8);
  const mage = createMockCharacter('Luna', 'WhiteMage', 60, 40, 6, 8, 18, 12);

  mage.currentStats.hp = 15;

  const goblin = createMockEnemy('Goblin', 'Goblin', 50, 10, 10, 6, 3, 9);
  const boss = createMockEnemy('Shadow Lord', 'ShadowLord', 180, 80, 20, 18, 22, 14, true);

  const allies = [mage];
  const enemies = [goblin, boss];

  console.log('Testing target selection:');

  const targetTypes = ['weakestEnemy', 'strongestEnemy', 'bossEnemy', 'lowestHpAlly', 'randomAlly'] as const;

  for (const targetType of targetTypes) {
    const result = TargetSelector.selectTarget(targetType, warrior, allies, enemies);
    console.log(`  ${targetType}: ${result.target?.name || 'None'} - ${result.reason}`);
  }

  console.log('\nOptimal target suggestions:');
  const actions = ['attack', 'heal', 'buff', 'debuff'] as const;

  for (const action of actions) {
    const suggestion = TargetSelector.suggestOptimalTarget(action, warrior, allies, enemies);
    console.log(`  ${action}: ${suggestion.target?.name || 'None'} - ${suggestion.reason}`);
  }
}

async function testBattleSystem() {
  console.log('\n⚔️ Testing Battle System...\n');

  const allies = [
    createMockCharacter('Kael', 'Warrior', 120, 20, 15, 12, 5, 8),
    createMockCharacter('Luna', 'WhiteMage', 80, 50, 6, 8, 20, 12)
  ];

  const enemies = [
    createMockEnemy('Goblin1', 'Goblin', 45, 10, 8, 4, 2, 6),
    createMockEnemy('Goblin2', 'Goblin', 45, 10, 8, 4, 2, 6)
  ];

  const battleSystem = new BattleSystem();

  console.log('Initializing battle...');
  const battleState = battleSystem.initializeBattle(allies, enemies);

  console.log(`Battle initialized with ${battleState.allies.length} allies vs ${battleState.enemies.length} enemies`);

  console.log('\nTurn order:');
  battleState.turnOrder.forEach((turn, index) => {
    console.log(`  ${index + 1}. ${turn.participant.name} (SPD: ${turn.speed}, Initiative: ${turn.initiative})`);
  });

  console.log('\nExecuting turns...');
  let turnCount = 0;
  const maxTurns = 10;

  while (!battleSystem.isBattleComplete() && turnCount < maxTurns) {
    const result = battleSystem.executeTurn();
    if (result) {
      console.log(`Turn ${result.turnNumber}: ${result.message}`);

      if (result.damage) {
        console.log(`  💥 Damage dealt: ${result.damage}`);
      }
      if (result.heal) {
        console.log(`  💚 Healing done: ${result.heal}`);
      }
    }
    turnCount++;
  }

  console.log('\nBattle status:');
  const status = battleSystem.getParticipantStatus();
  status.forEach(participant => {
    const statusIcon = participant.participant.isAlive ? '✅' : '💀';
    const teamIcon = participant.participant.isEnemy ? '🔴' : '🔵';
    console.log(`  ${statusIcon} ${teamIcon} ${participant.participant.name}: ${participant.hpPercent}% HP, ${participant.mpPercent}% MP, ${participant.buffs} buffs`);
  });

  if (battleSystem.isBattleComplete()) {
    const result = battleSystem.getBattleResult();
    console.log(`\n🏆 Battle Result: ${result?.victory ? 'VICTORY' : 'DEFEAT'}`);
    console.log(`   Reason: ${result?.reason}`);
    console.log(`   Turns: ${result?.turns}`);
  } else {
    console.log('\n⏰ Battle incomplete (reached turn limit)');
  }
}

async function testFullBattleSimulation() {
  console.log('\n🎮 Testing Full Battle Simulation...\n');

  const allies = [
    createMockCharacter('Kael', 'Warrior', 150, 20, 18, 15, 5, 8),
    createMockCharacter('Luna', 'WhiteMage', 80, 50, 6, 8, 20, 12),
    createMockCharacter('Zara', 'BlackMage', 70, 60, 5, 6, 25, 10)
  ];

  const enemies = [
    createMockEnemy('Orc Captain', 'Orc', 90, 20, 16, 12, 3, 6),
    createMockEnemy('Dark Mage', 'DarkMage', 75, 40, 6, 7, 18, 12),
    createMockEnemy('Shadow Lord', 'ShadowLord', 200, 80, 20, 18, 22, 14, true)
  ];

  const battleSystem = new BattleSystem();
  battleSystem.initializeBattle(allies, enemies);

  console.log('Starting battle simulation...');
  console.log(`Party: ${allies.map(a => a.name).join(', ')}`);
  console.log(`Enemies: ${enemies.map(e => e.name).join(', ')}`);

  const result = battleSystem.simulateFullBattle(50);

  console.log(`\n🏁 Battle completed in ${result.turns} turns`);
  console.log(`Result: ${result.victory ? '🎉 VICTORY' : '💀 DEFEAT'}`);
  console.log(`Reason: ${result.reason}`);

  console.log('\nSurviving allies:');
  result.survivingAllies.forEach(ally => {
    console.log(`  ✅ ${ally.name}: ${ally.currentStats.hp}/${ally.maxStats.hp} HP`);
  });

  console.log('\nDefeated enemies:');
  result.defeatedEnemies.forEach(enemy => {
    console.log(`  💀 ${enemy.name} (${enemy.type})`);
  });

  const history = battleSystem.getTurnHistory();
  console.log(`\nBattle history: ${history.length} actions recorded`);

  if (history.length > 0) {
    console.log('Key moments:');
    const keyMoments = history.filter((turn, index) =>
      index < 3 || index >= history.length - 3 || turn.damage && turn.damage > 20
    ).slice(0, 8);

    keyMoments.forEach(moment => {
      console.log(`  Turn ${moment.turnNumber}: ${moment.message}`);
    });
  }
}

async function testBattleEdgeCases() {
  console.log('\n🧪 Testing Battle Edge Cases...\n');

  console.log('Test 1: Battle with dead participants');
  const allies1 = [createMockCharacter('Kael', 'Warrior', 100, 20, 15, 12, 5, 8)];
  const enemies1 = [createMockEnemy('Goblin', 'Goblin', 45, 10, 8, 4, 2, 6)];

  enemies1[0]!.isAlive = false;
  enemies1[0]!.currentStats.hp = 0;

  const battleSystem1 = new BattleSystem();
  battleSystem1.initializeBattle(allies1, enemies1);
  const result1 = battleSystem1.simulateFullBattle();
  console.log(`  Result: ${result1.victory ? 'Victory' : 'Defeat'} - ${result1.reason}`);

  console.log('\nTest 2: Very low stats battle');
  const allies2 = [createMockCharacter('Weak Hero', 'Peasant', 10, 5, 2, 1, 1, 3)];
  const enemies2 = [createMockEnemy('Weak Slime', 'Slime', 8, 2, 1, 0, 0, 2)];

  const battleSystem2 = new BattleSystem();
  battleSystem2.initializeBattle(allies2, enemies2);
  const result2 = battleSystem2.simulateFullBattle(20);
  console.log(`  Result: ${result2.victory ? 'Victory' : 'Defeat'} - ${result2.reason}`);

  console.log('\nTest 3: High-speed battle');
  const allies3 = [createMockCharacter('Speed Demon', 'Ninja', 50, 30, 12, 8, 10, 25)];
  const enemies3 = [createMockEnemy('Slow Tank', 'Golem', 200, 10, 20, 25, 2, 1)];

  const battleSystem3 = new BattleSystem();
  battleSystem3.initializeBattle(allies3, enemies3);
  let speedTurns = 0;
  while (!battleSystem3.isBattleComplete() && speedTurns < 15) {
    battleSystem3.executeTurn();
    speedTurns++;
  }
  const result3 = battleSystem3.getBattleResult();
  console.log(`  Result: ${result3?.victory ? 'Victory' : 'Defeat'} after ${speedTurns} turns`);
}

async function runAllBattleTests() {
  try {
    console.log('🚀 Running Battle System Tests\n');

    await testTargetSelector();
    await testBattleSystem();
    await testFullBattleSimulation();
    await testBattleEdgeCases();

    console.log('\n🎉 All battle system tests completed!');
  } catch (error) {
    console.error('❌ Battle test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllBattleTests();
}

export { runAllBattleTests as testBattleSystem };