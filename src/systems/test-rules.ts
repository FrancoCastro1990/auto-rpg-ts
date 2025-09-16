import { ActionResolver } from './ActionResolver';
import { ConditionEvaluator } from './ConditionEvaluator';
import { BattleParticipant, Rule } from '../models/types';

function createMockParticipant(
  id: string,
  name: string,
  hp: number,
  maxHp: number,
  mp: number,
  maxMp: number,
  isEnemy: boolean = false,
  isBoss: boolean = false
): BattleParticipant {
  return {
    id,
    name,
    currentStats: { hp, mp, str: 10, def: 10, mag: 10, spd: 10 },
    maxStats: { hp: maxHp, mp: maxMp, str: 10, def: 10, mag: 10, spd: 10 },
    abilities: [],
    rules: [],
    buffs: [],
    isAlive: hp > 0,
    isEnemy,
    isBoss
  };
}

async function testConditionEvaluator() {
  console.log('🧪 Testing Condition Evaluator...\n');

  const evaluator = new ConditionEvaluator();

  const actor = createMockParticipant('warrior', 'Kael', 30, 100, 15, 20);
  const ally = createMockParticipant('mage', 'Luna', 20, 80, 40, 50);
  const enemy1 = createMockParticipant('goblin', 'Goblin', 25, 60, 10, 15, true);
  const enemy2 = createMockParticipant('boss', 'Shadow Lord', 150, 200, 80, 100, true, true);

  const context = evaluator.createTestContext(actor, [ally], [enemy1, enemy2], 3);

  const testConditions = [
    'always',
    'enemy.isBoss',
    'ally.hp < 30%',
    'ally.hp < 50%',
    'self.mp > 50%',
    'enemy.count > 1',
    'turn > 2'
  ];

  console.log('Condition evaluations:');
  for (const condition of testConditions) {
    const result = evaluator.evaluateCondition(condition, context);
    console.log(`  ${condition}: ${result ? '✅' : '❌'}`);
  }

  console.log('\nContext snapshot:');
  console.log(`  Actor HP: ${actor.currentStats.hp}/${actor.maxStats.hp} (${Math.round((actor.currentStats.hp / actor.maxStats.hp) * 100)}%)`);
  console.log(`  Actor MP: ${actor.currentStats.mp}/${actor.maxStats.mp} (${Math.round((actor.currentStats.mp / actor.maxStats.mp) * 100)}%)`);
  console.log(`  Ally HP: ${ally.currentStats.hp}/${ally.maxStats.hp} (${Math.round((ally.currentStats.hp / ally.maxStats.hp) * 100)}%)`);
  console.log(`  Living enemies: ${context.livingEnemies.length}`);
  console.log(`  Has boss: ${context.livingEnemies.some(e => e.isBoss)}`);
  console.log(`  Turn: ${context.turnNumber}`);
}

async function testActionResolver() {
  console.log('\n🎯 Testing Action Resolver...\n');

  const resolver = new ActionResolver();

  const warrior = createMockParticipant('warrior', 'Kael', 50, 150, 8, 20);
  warrior.rules = [
    { priority: 100, condition: 'enemy.isBoss', target: 'bossEnemy', action: 'cast:power_strike' },
    { priority: 80, condition: 'ally.hp < 30%', target: 'self', action: 'cast:taunt' },
    { priority: 60, condition: 'self.mp > 50%', target: 'strongestEnemy', action: 'cast:power_strike' },
    { priority: 10, condition: 'always', target: 'weakestEnemy', action: 'attack' }
  ];

  warrior.abilities = [
    { name: 'Power Strike', type: 'attack', effect: { damage: 25 }, mpCost: 5 },
    { name: 'Taunt', type: 'buff', effect: { statModifier: { def: 5 }, duration: 3 }, mpCost: 4 }
  ];

  const ally = createMockParticipant('mage', 'Luna', 20, 80, 40, 50);
  const enemy1 = createMockParticipant('goblin', 'Goblin', 25, 60, 10, 15, true);
  const enemy2 = createMockParticipant('boss', 'Shadow Lord', 180, 200, 80, 100, true, true);

  console.log('Scenario 1: Boss present, ally injured');
  const debug1 = resolver.debugActionResolution(warrior, [ally], [enemy1, enemy2], 1);
  console.log('Rule evaluations:');
  debug1.ruleEvaluations.forEach(({ rule, evaluation }) => {
    console.log(`  [${evaluation ? '✅' : '❌'}] Priority ${rule.priority}: ${rule.condition} -> ${rule.action}`);
  });
  console.log(`Selected action: ${debug1.resolvedAction?.message}`);

  console.log('\nScenario 2: No boss, high MP');
  warrior.currentStats.mp = 15;
  const debug2 = resolver.debugActionResolution(warrior, [ally], [enemy1], 1);
  console.log('Rule evaluations:');
  debug2.ruleEvaluations.forEach(({ rule, evaluation }) => {
    console.log(`  [${evaluation ? '✅' : '❌'}] Priority ${rule.priority}: ${rule.condition} -> ${rule.action}`);
  });
  console.log(`Selected action: ${debug2.resolvedAction?.message}`);

  console.log('\nScenario 3: Low MP, fallback to basic attack');
  warrior.currentStats.mp = 3;
  const debug3 = resolver.debugActionResolution(warrior, [ally], [enemy1], 1);
  console.log('Rule evaluations:');
  debug3.ruleEvaluations.forEach(({ rule, evaluation }) => {
    console.log(`  [${evaluation ? '✅' : '❌'}] Priority ${rule.priority}: ${rule.condition} -> ${rule.action}`);
  });
  console.log(`Selected action: ${debug3.resolvedAction?.message}`);
}

async function testTargetResolution() {
  console.log('\n🎯 Testing Target Resolution...\n');

  const resolver = new ActionResolver();

  const actor = createMockParticipant('warrior', 'Kael', 100, 150, 15, 20);
  const ally1 = createMockParticipant('mage', 'Luna', 20, 80, 40, 50);
  const ally2 = createMockParticipant('rogue', 'Raven', 60, 100, 25, 30);
  const enemy1 = createMockParticipant('goblin', 'Goblin', 15, 60, 10, 15, true);
  const enemy2 = createMockParticipant('orc', 'Orc', 45, 90, 20, 20, true);
  const enemy3 = createMockParticipant('boss', 'Shadow Lord', 180, 200, 80, 100, true, true);

  const targets = resolver.getAllPossibleTargets(actor, [ally1, ally2], [enemy1, enemy2, enemy3]);

  console.log('Target resolution:');
  Object.entries(targets).forEach(([targetType, target]) => {
    if (target) {
      const hpPercent = Math.round((target.currentStats.hp / target.maxStats.hp) * 100);
      console.log(`  ${targetType}: ${target.name} (${target.currentStats.hp}/${target.maxStats.hp} HP - ${hpPercent}%)`);
    } else {
      console.log(`  ${targetType}: No valid target`);
    }
  });
}

async function testRuleValidation() {
  console.log('\n✅ Testing Rule Validation...\n');

  const resolver = new ActionResolver();

  const validRules: Rule[] = [
    { priority: 100, condition: 'enemy.isBoss', target: 'bossEnemy', action: 'cast:power_strike' },
    { priority: 80, condition: 'ally.hp < 30%', target: 'lowestHpAlly', action: 'cast:heal' },
    { priority: 60, condition: 'self.mp > 50%', target: 'strongestEnemy', action: 'cast:fireball' },
    { priority: 10, condition: 'always', target: 'weakestEnemy', action: 'attack' }
  ];

  const invalidRules: Rule[] = [
    { priority: 100, condition: 'invalid.condition', target: 'bossEnemy', action: 'cast:power_strike' },
    { priority: 80, condition: 'ally.hp < 30%', target: 'invalidTarget', action: 'cast:heal' },
    { priority: 60, condition: 'self.mp > 50%', target: 'strongestEnemy', action: 'invalid:action' }
  ];

  console.log('Valid rules validation:');
  const validValidation = resolver.validateRulesConfiguration(validRules);
  console.log(`  Valid: ${validValidation.valid ? '✅' : '❌'}`);
  console.log(`  Errors: ${validValidation.errors.length}`);
  console.log(`  Warnings: ${validValidation.warnings.length}`);

  if (validValidation.warnings.length > 0) {
    console.log('  Warnings:');
    validValidation.warnings.forEach(({ warning }) => {
      console.log(`    - ${warning}`);
    });
  }

  console.log('\nInvalid rules validation:');
  const invalidValidation = resolver.validateRulesConfiguration(invalidRules);
  console.log(`  Valid: ${invalidValidation.valid ? '✅' : '❌'}`);
  console.log(`  Errors: ${invalidValidation.errors.length}`);
  if (invalidValidation.errors.length > 0) {
    console.log('  Errors:');
    invalidValidation.errors.forEach(({ error }) => {
      console.log(`    - ${error}`);
    });
  }
}

async function runAllTests() {
  try {
    console.log('🚀 Running Rules Engine Tests\n');

    await testConditionEvaluator();
    await testActionResolver();
    await testTargetResolution();
    await testRuleValidation();

    console.log('\n🎉 All rules engine tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests();
}

export { runAllTests as testRulesEngine };