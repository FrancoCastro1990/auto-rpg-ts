import { EnemyAI, EnemyDecision } from '../src/systems/EnemyAI';
import { LootSystem } from '../src/systems/LootSystem';
import { BattleSystem } from '../src/systems/BattleSystem';
import { EnemyInstance, Character, Stats } from '../src/models/types';

// Mock data for testing
const createMockEnemy = (type: string, name: string, isBoss: boolean = false): EnemyInstance => {
  const baseStats: Stats = {
    hp: 100,
    mp: 50,
    str: 10,
    def: 8,
    mag: 12,
    spd: 10
  };

  return {
    id: `enemy_${name.toLowerCase()}`,
    name,
    type,
    job: 'Warrior',
    currentStats: { ...baseStats },
    maxStats: { ...baseStats },
    baseStats,
    abilities: [
      {
        id: 'basic_attack',
        name: 'basic_attack',
        type: 'attack',
        effect: { damage: 15 },
        mpCost: 0,
        cooldown: 0,
        description: 'Basic attack'
      },
      {
        id: 'power_strike',
        name: 'power_strike',
        type: 'attack',
        effect: { damage: 25 },
        mpCost: 10,
        cooldown: 2,
        description: 'Powerful strike'
      }
    ],
    rules: [],
    buffs: [],
    skillCooldowns: [],
    isAlive: true,
    isEnemy: true,
    isBoss
  };
};

const createMockAlly = (name: string): Character => {
  const baseStats: Stats = {
    hp: 120,
    mp: 60,
    str: 12,
    def: 10,
    mag: 8,
    spd: 8
  };

  return {
    id: `ally_${name.toLowerCase()}`,
    name,
    job: 'Warrior',
    level: 1,
    currentStats: { ...baseStats },
    maxStats: { ...baseStats },
    baseStats,
    abilities: [
      {
        id: 'basic_attack',
        name: 'basic_attack',
        type: 'attack',
        effect: { damage: 20 },
        mpCost: 0,
        cooldown: 0,
        description: 'Basic attack'
      }
    ],
    rules: [
      {
        priority: 10,
        condition: 'always',
        target: 'randomEnemy',
        action: 'attack'
      }
    ],
    buffs: [],
    skillCooldowns: [],
    isAlive: true,
    isEnemy: false
  };
};

describe('EnemyAI System Tests', () => {
  let enemyAI: EnemyAI;
  let lootSystem: LootSystem;
  let battleSystem: BattleSystem;

  beforeEach(() => {
    enemyAI = new EnemyAI();
    lootSystem = new LootSystem();
    battleSystem = new BattleSystem();
  });

  describe('EnemyAI Decision Making', () => {
    test('should make aggressive decisions for aggressive enemies', () => {
      const enemy = createMockEnemy('Goblin', 'Test Goblin');
      const allies = [enemy];
      const enemies = [createMockAlly('Hero')];

      const decision = enemyAI.makeDecision(enemy, allies, enemies, 1);

      expect(decision).toBeDefined();
      expect(['attack', 'cast', 'defend']).toContain(decision.action);
      expect(decision.priority).toBeGreaterThan(0);
      expect(decision.reasoning).toContain('aggressive');
    });

    test('should adapt behavior based on HP levels', () => {
      const enemy = createMockEnemy('Orc', 'Test Orc');
      enemy.currentStats.hp = 20; // Low HP
      const allies = [enemy];
      const enemies = [createMockAlly('Hero')];

      const decision = enemyAI.makeDecision(enemy, allies, enemies, 1);

      expect(decision).toBeDefined();
      expect(decision.reasoning).toContain('behavior');
    });

    test('should handle boss enemies with special logic', () => {
      const boss = createMockEnemy('ShadowLord', 'Shadow Lord', true);
      const allies = [boss];
      const enemies = [createMockAlly('Hero')];

      const decision = enemyAI.makeDecision(boss, allies, enemies, 1);

      expect(decision).toBeDefined();
      expect(decision.priority).toBeGreaterThan(100); // Boss priority should be high
    });

    test('should fallback gracefully when no valid targets', () => {
      const enemy = createMockEnemy('Slime', 'Test Slime');
      const allies = [enemy];
      const enemies: Character[] = []; // No enemies

      const decision = enemyAI.makeDecision(enemy, allies, enemies, 1);

      expect(decision).toBeDefined();
      expect(decision.action).toBe('attack');
      expect(decision.reasoning).toContain('Fallback');
    });
  });

  describe('Loot System Tests', () => {
    test('should generate loot for defeated enemies', () => {
      const enemy = createMockEnemy('Goblin', 'Test Goblin');
      enemy.isAlive = false;

      const loot = lootSystem.generateLootForEnemy(enemy);

      expect(loot).toBeDefined();
      expect(loot.gold).toBeGreaterThanOrEqual(0);
      expect(loot.experience).toBeGreaterThan(0);
      expect(loot.source).toBe('Test Goblin');
      expect(Array.isArray(loot.items)).toBe(true);
    });

    test('should generate different loot for different enemy types', () => {
      const goblin = createMockEnemy('Goblin', 'Goblin');
      const orc = createMockEnemy('Orc', 'Orc');
      goblin.isAlive = false;
      orc.isAlive = false;

      const goblinLoot = lootSystem.generateLootForEnemy(goblin);
      const orcLoot = lootSystem.generateLootForEnemy(orc);

      // Orcs should generally give more gold than goblins
      expect(orcLoot.gold).toBeGreaterThanOrEqual(goblinLoot.gold - 10);
      expect(orcLoot.experience).toBeGreaterThan(goblinLoot.experience);
    });

    test('should generate battle loot summary', () => {
      const enemies = [
        createMockEnemy('Goblin', 'Goblin 1'),
        createMockEnemy('Orc', 'Orc 1'),
        createMockEnemy('Slime', 'Slime 1')
      ].map(e => { e.isAlive = false; return e; });

      const battleLoot = lootSystem.generateBattleLoot(enemies);

      expect(battleLoot.totalGold).toBeGreaterThan(0);
      expect(battleLoot.totalExperience).toBeGreaterThan(0);
      expect(battleLoot.allItems).toBeDefined();
      expect(battleLoot.lootByEnemy).toHaveLength(3);
    });

    test('should handle boss loot with guaranteed drops', () => {
      const boss = createMockEnemy('ShadowLord', 'Shadow Lord', true);
      boss.isAlive = false;

      const loot = lootSystem.generateLootForEnemy(boss);

      expect(loot.gold).toBeGreaterThan(50); // Bosses should give more gold
      expect(loot.experience).toBeGreaterThan(50); // Bosses should give more exp
    });
  });

  describe('BattleSystem Integration', () => {
    test('should integrate EnemyAI with BattleSystem', () => {
      const allies = [createMockAlly('Hero')];
      const enemies = [createMockEnemy('Goblin', 'Goblin')];

      battleSystem.initializeBattle(allies, enemies);

      // Execute a few turns
      for (let i = 0; i < 3; i++) {
        const result = battleSystem.executeTurn();
        expect(result).toBeDefined();
        expect(result!.success).toBeDefined();
      }

      expect(battleSystem.getBattleState()).toBeDefined();
    });

    test('should generate loot when battle ends', () => {
      const allies = [createMockAlly('Hero')];
      const enemies = [createMockEnemy('Slime', 'Slime')];

      battleSystem.initializeBattle(allies, enemies);

      // Simulate battle until completion
      let turns = 0;
      while (!battleSystem.isBattleComplete() && turns < 50) {
        battleSystem.executeTurn();
        turns++;
      }

      const result = battleSystem.getBattleResult();
      expect(result).toBeDefined();
      expect(result!.loot).toBeDefined();
      expect(result!.loot!.totalGold).toBeGreaterThanOrEqual(0);
      expect(result!.loot!.totalExperience).toBeGreaterThan(0);
    });

    test('should handle multiple enemy types in battle', () => {
      const allies = [createMockAlly('Hero'), createMockAlly('Mage')];
      const enemies = [
        createMockEnemy('Goblin', 'Goblin'),
        createMockEnemy('Orc', 'Orc'),
        createMockEnemy('DarkMage', 'Dark Mage')
      ];

      battleSystem.initializeBattle(allies, enemies);

      // Execute turns until battle ends or timeout
      let turns = 0;
      while (!battleSystem.isBattleComplete() && turns < 100) {
        battleSystem.executeTurn();
        turns++;
      }

      const result = battleSystem.getBattleResult();
      expect(result).toBeDefined();

      if (result!.victory) {
        expect(result!.loot).toBeDefined();
        expect(result!.loot!.totalGold).toBeGreaterThan(0);
        expect(result!.loot!.totalExperience).toBeGreaterThan(0);
      }
    });
  });

  describe('Enemy Variety Validation', () => {
    test('should have diverse enemy archetypes', () => {
      const enemyTypes = [
        'Slime', 'Goblin', 'Orc', 'DarkMage', 'Troll',
        'SkeletonArcher', 'FireElemental', 'IceGolem',
        'Wraith', 'Minotaur', 'ShadowLord', 'DragonWhelp', 'Necromancer'
      ];

      for (const type of enemyTypes) {
        const enemy = createMockEnemy(type, `${type} Test`);
        const allies = [enemy];
        const enemies = [createMockAlly('Hero')];

        const decision = enemyAI.makeDecision(enemy, allies, enemies, 1);
        expect(decision).toBeDefined();
        expect(decision.action).toBeDefined();
      }
    });

    test('should generate loot for all enemy types', () => {
      const enemyTypes = [
        'Slime', 'Goblin', 'Orc', 'DarkMage', 'Troll',
        'SkeletonArcher', 'FireElemental', 'IceGolem',
        'Wraith', 'Minotaur', 'ShadowLord', 'DragonWhelp', 'Necromancer'
      ];

      for (const type of enemyTypes) {
        const enemy = createMockEnemy(type, `${type} Test`);
        enemy.isAlive = false;

        const loot = lootSystem.generateLootForEnemy(enemy);
        expect(loot).toBeDefined();
        expect(loot.gold).toBeGreaterThanOrEqual(0);
        expect(loot.experience).toBeGreaterThan(0);
      }
    });

    test('should handle edge cases gracefully', () => {
      // Test with enemy that has no abilities
      const enemy = createMockEnemy('Test', 'Test Enemy');
      enemy.abilities = [];
      const allies = [enemy];
      const enemies = [createMockAlly('Hero')];

      const decision = enemyAI.makeDecision(enemy, allies, enemies, 1);
      expect(decision).toBeDefined();
      expect(decision.action).toBe('attack'); // Should fallback to attack

      // Test loot for unknown enemy type
      const unknownEnemy = createMockEnemy('UnknownType', 'Unknown');
      unknownEnemy.isAlive = false;
      const loot = lootSystem.generateLootForEnemy(unknownEnemy);
      expect(loot).toBeDefined();
      expect(loot.gold).toBeGreaterThanOrEqual(0);
    });
  });
});