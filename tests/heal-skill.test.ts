/**
 * Unit tests for the Heal skill functionality
 * Tests the execution of healing skills in battle scenarios
 */

import { BattleSystem } from '../src/systems/BattleSystem';
import { Character, EnemyInstance, Stats, Ability } from '../src/models/types';
import { BattleLogger } from '../src/utils/BattleLogger';

// Mock data for testing
const createMockCharacter = (name: string, job: string, hp: number, mp: number, abilities: Ability[] = []): Character => {
  const baseStats: Stats = {
    hp: hp,
    mp: mp,
    str: 10,
    def: 8,
    mag: 12,
    spd: 10
  };

  return {
    id: `char_${name.toLowerCase().replace(' ', '_')}`,
    name,
    job,
    level: 1,
    currentStats: { ...baseStats },
    maxStats: { ...baseStats },
    baseStats,
    abilities: abilities,
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

const createMockEnemy = (name: string, hp: number, mp: number): EnemyInstance => {
  const baseStats: Stats = {
    hp: hp,
    mp: mp,
    str: 8,
    def: 6,
    mag: 8,
    spd: 8
  };

  return {
    id: `enemy_${name.toLowerCase().replace(' ', '_')}`,
    name,
    type: 'Goblin',
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
    isEnemy: true,
    isBoss: false
  };
};

const healSkill: Ability = {
  id: 'heal',
  name: 'heal',
  type: 'heal',
  effect: {
    heal: 35
  },
  mpCost: 8,
  description: 'Restores HP to an ally'
};

const greaterHealSkill: Ability = {
  id: 'greater_heal',
  name: 'greater_heal',
  type: 'heal',
  effect: {
    heal: 65
  },
  mpCost: 15,
  description: 'Powerful healing spell'
};

describe('Heal Skill Tests', () => {
  let battleSystem: BattleSystem;
  let logger: BattleLogger;

  beforeEach(() => {
    logger = new BattleLogger({
      logLevel: 'ERROR',
      useColors: false,
      compactMode: true
    });
    battleSystem = new BattleSystem(logger);
  });

  describe('Basic Heal Skill Execution', () => {
    test('should successfully heal an ally with full heal skill', () => {
      // Create healer with heal skill
      const healer = createMockCharacter('Luna', 'WhiteMage', 80, 50, [healSkill]);

      // Create wounded ally
      const woundedAlly = createMockCharacter('Kael', 'Warrior', 50, 20); // 50/150 HP
      woundedAlly.maxStats.hp = 150; // Set max HP to 150

      // Create enemy
      const enemy = createMockEnemy('Goblin', 60, 0);

      // Initialize battle
      battleSystem.initializeBattle([healer, woundedAlly], [enemy]);

      // Execute heal skill manually by simulating the turn
      const battleState = battleSystem.getBattleState()!;
      const turnResult = battleSystem['executeSkill'](healer, woundedAlly, healSkill, {
        rule: {
          priority: 10,
          condition: 'always',
          target: 'lowestHpAlly',
          action: 'cast:heal'
        },
        actionType: 'cast',
        skillId: 'heal',
        targetId: woundedAlly.id,
        targetName: woundedAlly.name,
        priority: 10,
        success: true,
        message: 'Test heal execution'
      });

      // Verify heal was successful
      expect(turnResult.success).toBe(true);
      expect(turnResult.heal).toBeDefined();
      expect(turnResult.heal).toBeGreaterThan(0);
      expect(turnResult.message).toContain('healing');
      expect(turnResult.message).toContain('HP');

      // Verify HP was actually restored
      expect(woundedAlly.currentStats.hp).toBeGreaterThan(50); // Should be healed
      expect(woundedAlly.currentStats.hp).toBeLessThanOrEqual(150); // Should not exceed max HP

      // Verify MP was consumed
      expect(healer.currentStats.mp).toBe(42); // 50 - 8 = 42
    });

    test('should not exceed maximum HP when healing', () => {
      // Create healer
      const healer = createMockCharacter('Luna', 'WhiteMage', 80, 50, [healSkill]);

      // Create ally with high HP (close to max)
      const healthyAlly = createMockCharacter('Kael', 'Warrior', 140, 20); // 140/150 HP
      healthyAlly.maxStats.hp = 150;

      // Create enemy
      const enemy = createMockEnemy('Goblin', 60, 0);

      // Initialize battle
      battleSystem.initializeBattle([healer, healthyAlly], [enemy]);

      // Execute heal skill
      const turnResult = battleSystem['executeSkill'](healer, healthyAlly, healSkill, {
        rule: {
          priority: 10,
          condition: 'always',
          target: 'lowestHpAlly',
          action: 'cast:heal'
        },
        actionType: 'cast',
        skillId: 'heal',
        targetId: healthyAlly.id,
        targetName: healthyAlly.name,
        priority: 10,
        success: true,
        message: 'Test heal execution'
      });

      // Verify heal was successful but didn't exceed max HP
      expect(turnResult.success).toBe(true);
      expect(turnResult.heal).toBeDefined();
      expect(turnResult.heal).toBeLessThanOrEqual(10); // Should only heal up to max HP (150-140=10)

      // Verify HP is exactly at max
      expect(healthyAlly.currentStats.hp).toBe(150);

      // Verify MP was consumed
      expect(healer.currentStats.mp).toBe(42);
    });

    test('should fail when healer has insufficient MP', () => {
      // Create healer with low MP
      const healer = createMockCharacter('Luna', 'WhiteMage', 80, 5, [healSkill]); // Only 5 MP, need 8

      // Create wounded ally
      const woundedAlly = createMockCharacter('Kael', 'Warrior', 50, 20);
      woundedAlly.maxStats.hp = 150;

      // Create enemy
      const enemy = createMockEnemy('Goblin', 60, 0);

      // Initialize battle
      battleSystem.initializeBattle([healer, woundedAlly], [enemy]);

      // Execute heal skill
      const turnResult = battleSystem['executeSkill'](healer, woundedAlly, healSkill, {
        rule: {
          priority: 10,
          condition: 'always',
          target: 'lowestHpAlly',
          action: 'cast:heal'
        },
        actionType: 'cast',
        skillId: 'heal',
        targetId: woundedAlly.id,
        targetName: woundedAlly.name,
        priority: 10,
        success: true,
        message: 'Test heal execution'
      });

      // Verify heal failed due to insufficient MP
      expect(turnResult.success).toBe(false);
      expect(turnResult.message).toContain('not enough MP');
      expect(turnResult.message).toContain('need 8');

      // Verify HP was not restored
      expect(woundedAlly.currentStats.hp).toBe(50);

      // Verify MP was not consumed
      expect(healer.currentStats.mp).toBe(5);
    });
  });

  describe('Greater Heal Skill Execution', () => {
    test('should heal more HP with greater heal skill', () => {
      // Create healer with greater heal skill
      const healer = createMockCharacter('Elara', 'WhiteMage', 88, 55, [greaterHealSkill]);

      // Create severely wounded ally
      const woundedAlly = createMockCharacter('Thrain', 'Warrior', 30, 22);
      woundedAlly.maxStats.hp = 165;

      // Create enemy
      const enemy = createMockEnemy('Orc', 90, 0);

      // Initialize battle
      battleSystem.initializeBattle([healer, woundedAlly], [enemy]);

      // Execute greater heal skill
      const turnResult = battleSystem['executeSkill'](healer, woundedAlly, greaterHealSkill, {
        rule: {
          priority: 10,
          condition: 'always',
          target: 'lowestHpAlly',
          action: 'cast:greater_heal'
        },
        actionType: 'cast',
        skillId: 'greater_heal',
        targetId: woundedAlly.id,
        targetName: woundedAlly.name,
        priority: 10,
        success: true,
        message: 'Test greater heal execution'
      });

      // Verify greater heal was successful
      expect(turnResult.success).toBe(true);
      expect(turnResult.heal).toBeDefined();
      expect(turnResult.heal).toBeGreaterThan(35); // Should heal more than basic heal

      // Verify HP was restored significantly
      expect(woundedAlly.currentStats.hp).toBeGreaterThan(30);
      expect(woundedAlly.currentStats.hp).toBeLessThanOrEqual(165);

      // Verify MP was consumed (15 MP cost)
      expect(healer.currentStats.mp).toBe(40); // 55 - 15 = 40
    });
  });

  describe('Heal Skill Integration with Battle System', () => {
    test('should integrate heal skill with full battle system', () => {
      // Create healer with heal skill
      const healer = createMockCharacter('Luna', 'WhiteMage', 80, 50, [healSkill]);

      // Create wounded ally
      const woundedAlly = createMockCharacter('Kael', 'Warrior', 40, 20);
      woundedAlly.maxStats.hp = 150;

      // Create enemy
      const enemy = createMockEnemy('Goblin', 60, 0);

      // Initialize battle
      battleSystem.initializeBattle([healer, woundedAlly], [enemy]);

      // Execute a full turn to test integration
      const turnResult = battleSystem.executeTurn();

      // Verify turn executed successfully
      expect(turnResult).toBeDefined();
      expect(turnResult!.success).toBe(true);

      // Get battle state to verify changes
      const battleState = battleSystem.getBattleState();
      expect(battleState).toBeDefined();

      // Verify battle is not complete
      expect(battleState!.isComplete).toBe(false);
    });

    test('should handle multiple healing targets correctly', () => {
      // Create healer
      const healer = createMockCharacter('Luna', 'WhiteMage', 80, 100, [healSkill, greaterHealSkill]);

      // Create multiple wounded allies
      const ally1 = createMockCharacter('Kael', 'Warrior', 30, 20);
      ally1.maxStats.hp = 150;

      const ally2 = createMockCharacter('Zara', 'BlackMage', 20, 60);
      ally2.maxStats.hp = 70;

      // Create enemy
      const enemy = createMockEnemy('Goblin', 60, 0);

      // Initialize battle
      battleSystem.initializeBattle([healer, ally1, ally2], [enemy]);

      // Heal first ally
      const healResult1 = battleSystem['executeSkill'](healer, ally1, healSkill, {
        rule: {
          priority: 10,
          condition: 'always',
          target: 'lowestHpAlly',
          action: 'cast:heal'
        },
        actionType: 'cast',
        skillId: 'heal',
        targetId: ally1.id,
        targetName: ally1.name,
        priority: 10,
        success: true,
        message: 'Heal ally 1'
      });

      // Heal second ally with greater heal
      const healResult2 = battleSystem['executeSkill'](healer, ally2, greaterHealSkill, {
        rule: {
          priority: 10,
          condition: 'always',
          target: 'lowestHpAlly',
          action: 'cast:greater_heal'
        },
        actionType: 'cast',
        skillId: 'greater_heal',
        targetId: ally2.id,
        targetName: ally2.name,
        priority: 10,
        success: true,
        message: 'Heal ally 2'
      });

      // Verify both heals were successful
      expect(healResult1.success).toBe(true);
      expect(healResult2.success).toBe(true);

      // Verify HP was restored for both allies
      expect(ally1.currentStats.hp).toBeGreaterThan(30);
      expect(ally2.currentStats.hp).toBeGreaterThan(20);

      // Verify MP was consumed correctly
      expect(healer.currentStats.mp).toBe(100 - 8 - 15); // 77 MP remaining
    });
  });

  describe('Heal Skill Edge Cases', () => {
    test('should handle healing dead characters (should still work)', () => {
      // Create healer
      const healer = createMockCharacter('Luna', 'WhiteMage', 80, 50, [healSkill]);

      // Create dead ally
      const deadAlly = createMockCharacter('Kael', 'Warrior', 0, 20);
      deadAlly.maxStats.hp = 150;
      deadAlly.isAlive = false;

      // Create enemy
      const enemy = createMockEnemy('Goblin', 60, 0);

      // Initialize battle
      battleSystem.initializeBattle([healer, deadAlly], [enemy]);

      // Execute heal skill on dead character
      const turnResult = battleSystem['executeSkill'](healer, deadAlly, healSkill, {
        rule: {
          priority: 10,
          condition: 'always',
          target: 'lowestHpAlly',
          action: 'cast:heal'
        },
        actionType: 'cast',
        skillId: 'heal',
        targetId: deadAlly.id,
        targetName: deadAlly.name,
        priority: 10,
        success: true,
        message: 'Test heal on dead character'
      });

      // Verify heal was successful
      expect(turnResult.success).toBe(true);
      expect(turnResult.heal).toBeDefined();

      // Verify HP was restored even on dead character
      expect(deadAlly.currentStats.hp).toBeGreaterThan(0);

      // Note: isAlive status should remain false (resurrection would need a different skill)
      expect(deadAlly.isAlive).toBe(false);
    });

    test('should handle zero heal amount gracefully', () => {
      // Create healer
      const healer = createMockCharacter('Luna', 'WhiteMage', 80, 50, [healSkill]);

      // Create ally at full HP
      const fullHpAlly = createMockCharacter('Kael', 'Warrior', 150, 20);
      fullHpAlly.maxStats.hp = 150;

      // Create enemy
      const enemy = createMockEnemy('Goblin', 60, 0);

      // Initialize battle
      battleSystem.initializeBattle([healer, fullHpAlly], [enemy]);

      // Execute heal skill on full HP character
      const turnResult = battleSystem['executeSkill'](healer, fullHpAlly, healSkill, {
        rule: {
          priority: 10,
          condition: 'always',
          target: 'lowestHpAlly',
          action: 'cast:heal'
        },
        actionType: 'cast',
        skillId: 'heal',
        targetId: fullHpAlly.id,
        targetName: fullHpAlly.name,
        priority: 10,
        success: true,
        message: 'Test heal on full HP character'
      });

      // Verify heal was successful but healed 0 HP
      expect(turnResult.success).toBe(true);
      expect(turnResult.heal).toBe(0);

      // Verify HP remains at max
      expect(fullHpAlly.currentStats.hp).toBe(150);

      // Verify MP was still consumed
      expect(healer.currentStats.mp).toBe(42);
    });
  });
});