import { LootItem, LootDrop, EnemyLootTable, BattleLoot, EnemyInstance } from '../models/types';

export class LootSystem {
  private lootTables: Map<string, EnemyLootTable>;
  private availableItems: Map<string, LootItem>;

  constructor() {
    this.lootTables = new Map();
    this.availableItems = new Map();
    this.initializeDefaultLootTables();
    this.initializeDefaultItems();
  }

  private initializeDefaultItems(): void {
    // Consumables
    this.availableItems.set('health_potion', {
      id: 'health_potion',
      name: 'Health Potion',
      type: 'consumable',
      rarity: 'common',
      value: 50,
      description: 'Restores 50 HP',
      effect: { heal: 50 }
    });

    this.availableItems.set('mana_potion', {
      id: 'mana_potion',
      name: 'Mana Potion',
      type: 'consumable',
      rarity: 'common',
      value: 40,
      description: 'Restores 30 MP',
      effect: { mpRestore: 30 }
    });

    this.availableItems.set('greater_health_potion', {
      id: 'greater_health_potion',
      name: 'Greater Health Potion',
      type: 'consumable',
      rarity: 'uncommon',
      value: 120,
      description: 'Restores 120 HP',
      effect: { heal: 120 }
    });

    // Materials
    this.availableItems.set('slime_gel', {
      id: 'slime_gel',
      name: 'Slime Gel',
      type: 'material',
      rarity: 'common',
      value: 10,
      description: 'Gelatinous substance from slimes'
    });

    this.availableItems.set('goblin_tooth', {
      id: 'goblin_tooth',
      name: 'Goblin Tooth',
      type: 'material',
      rarity: 'common',
      value: 15,
      description: 'Sharp tooth from a goblin'
    });

    this.availableItems.set('orc_tusk', {
      id: 'orc_tusk',
      name: 'Orc Tusk',
      type: 'material',
      rarity: 'uncommon',
      value: 35,
      description: 'Large tusk from an orc'
    });

    this.availableItems.set('dark_crystal', {
      id: 'dark_crystal',
      name: 'Dark Crystal',
      type: 'material',
      rarity: 'rare',
      value: 100,
      description: 'Crystal infused with dark magic'
    });

    this.availableItems.set('dragon_scale', {
      id: 'dragon_scale',
      name: 'Dragon Scale',
      type: 'material',
      rarity: 'epic',
      value: 250,
      description: 'Scale from a dragon'
    });

    // Weapons
    this.availableItems.set('rusty_sword', {
      id: 'rusty_sword',
      name: 'Rusty Sword',
      type: 'weapon',
      rarity: 'common',
      value: 75,
      description: 'An old, rusty sword',
      effect: { statModifier: { str: 2 } }
    });

    this.availableItems.set('bone_staff', {
      id: 'bone_staff',
      name: 'Bone Staff',
      type: 'weapon',
      rarity: 'uncommon',
      value: 150,
      description: 'Staff made from bones',
      effect: { statModifier: { mag: 3 } }
    });

    // Armor
    this.availableItems.set('leather_armor', {
      id: 'leather_armor',
      name: 'Leather Armor',
      type: 'armor',
      rarity: 'common',
      value: 80,
      description: 'Basic leather armor',
      effect: { statModifier: { def: 3 } }
    });

    this.availableItems.set('chain_mail', {
      id: 'chain_mail',
      name: 'Chain Mail',
      type: 'armor',
      rarity: 'uncommon',
      value: 200,
      description: 'Heavy chain mail armor',
      effect: { statModifier: { def: 5 } }
    });
  }

  private initializeDefaultLootTables(): void {
    // Slime loot table
    this.lootTables.set('Slime', {
      enemyType: 'Slime',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'slime_gel', dropRate: 0.8, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'health_potion', dropRate: 0.3, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 5, max: 15 },
      experienceReward: 10
    });

    // Goblin loot table
    this.lootTables.set('Goblin', {
      enemyType: 'Goblin',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'goblin_tooth', dropRate: 0.6, minQuantity: 1, maxQuantity: 3 },
        { itemId: 'health_potion', dropRate: 0.4, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'rusty_sword', dropRate: 0.2, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 8, max: 20 },
      experienceReward: 15
    });

    // Orc loot table
    this.lootTables.set('Orc', {
      enemyType: 'Orc',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'orc_tusk', dropRate: 0.5, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'health_potion', dropRate: 0.3, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'mana_potion', dropRate: 0.2, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'chain_mail', dropRate: 0.1, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 15, max: 35 },
      experienceReward: 25
    });

    // DarkMage loot table
    this.lootTables.set('DarkMage', {
      enemyType: 'DarkMage',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'dark_crystal', dropRate: 0.4, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'mana_potion', dropRate: 0.5, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'bone_staff', dropRate: 0.15, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 20, max: 45 },
      experienceReward: 30
    });

    // Troll loot table
    this.lootTables.set('Troll', {
      enemyType: 'Troll',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'greater_health_potion', dropRate: 0.3, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'health_potion', dropRate: 0.6, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'leather_armor', dropRate: 0.25, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 12, max: 28 },
      experienceReward: 20
    });

    // SkeletonArcher loot table
    this.lootTables.set('SkeletonArcher', {
      enemyType: 'SkeletonArcher',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'bone_staff', dropRate: 0.2, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'mana_potion', dropRate: 0.4, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 10, max: 25 },
      experienceReward: 18
    });

    // FireElemental loot table
    this.lootTables.set('FireElemental', {
      enemyType: 'FireElemental',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'mana_potion', dropRate: 0.5, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'greater_health_potion', dropRate: 0.2, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 18, max: 40 },
      experienceReward: 28
    });

    // IceGolem loot table
    this.lootTables.set('IceGolem', {
      enemyType: 'IceGolem',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'chain_mail', dropRate: 0.3, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'health_potion', dropRate: 0.4, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 16, max: 35 },
      experienceReward: 22
    });

    // Wraith loot table
    this.lootTables.set('Wraith', {
      enemyType: 'Wraith',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'dark_crystal', dropRate: 0.3, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'mana_potion', dropRate: 0.6, minQuantity: 1, maxQuantity: 2 }
      ],
      goldRange: { min: 22, max: 48 },
      experienceReward: 32
    });

    // Minotaur loot table
    this.lootTables.set('Minotaur', {
      enemyType: 'Minotaur',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'orc_tusk', dropRate: 0.7, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'greater_health_potion', dropRate: 0.3, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'chain_mail', dropRate: 0.2, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 20, max: 42 },
      experienceReward: 35
    });

    // ShadowLord loot table (Boss)
    this.lootTables.set('ShadowLord', {
      enemyType: 'ShadowLord',
      guaranteedDrops: [
        { itemId: 'dark_crystal', dropRate: 1.0, minQuantity: 2, maxQuantity: 3 }
      ],
      randomDrops: [
        { itemId: 'greater_health_potion', dropRate: 0.8, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'mana_potion', dropRate: 0.8, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'bone_staff', dropRate: 0.4, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'chain_mail', dropRate: 0.3, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 100, max: 200 },
      experienceReward: 100
    });

    // DragonWhelp loot table
    this.lootTables.set('DragonWhelp', {
      enemyType: 'DragonWhelp',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'dragon_scale', dropRate: 0.5, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'greater_health_potion', dropRate: 0.4, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'mana_potion', dropRate: 0.4, minQuantity: 1, maxQuantity: 1 }
      ],
      goldRange: { min: 25, max: 55 },
      experienceReward: 40
    });

    // Necromancer loot table
    this.lootTables.set('Necromancer', {
      enemyType: 'Necromancer',
      guaranteedDrops: [],
      randomDrops: [
        { itemId: 'dark_crystal', dropRate: 0.6, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'bone_staff', dropRate: 0.4, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'mana_potion', dropRate: 0.7, minQuantity: 1, maxQuantity: 2 }
      ],
      goldRange: { min: 30, max: 65 },
      experienceReward: 45
    });
  }

  generateLootForEnemy(enemy: EnemyInstance): BattleLoot {
    const lootTable = this.lootTables.get(enemy.type);

    if (!lootTable) {
      // Default loot for unknown enemy types
      return {
        gold: Math.floor(Math.random() * 20) + 5,
        experience: 10,
        items: [],
        source: enemy.name
      };
    }

    const loot: BattleLoot = {
      gold: this.generateGold(lootTable.goldRange),
      experience: lootTable.experienceReward,
      items: [],
      source: enemy.name
    };

    // Process guaranteed drops
    for (const drop of lootTable.guaranteedDrops) {
      if (Math.random() <= drop.dropRate) {
        const quantity = this.generateQuantity(drop);
        const item = this.availableItems.get(drop.itemId);
        if (item) {
          loot.items.push({ item, quantity });
        }
      }
    }

    // Process random drops
    for (const drop of lootTable.randomDrops) {
      if (Math.random() <= drop.dropRate) {
        const quantity = this.generateQuantity(drop);
        const item = this.availableItems.get(drop.itemId);
        if (item) {
          loot.items.push({ item, quantity });
        }
      }
    }

    return loot;
  }

  private generateGold(range: { min: number; max: number }): number {
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  private generateQuantity(drop: LootDrop): number {
    if (drop.minQuantity && drop.maxQuantity) {
      return Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1)) + drop.minQuantity;
    }
    return 1;
  }

  generateBattleLoot(defeatedEnemies: EnemyInstance[]): {
    totalGold: number;
    totalExperience: number;
    allItems: Array<{ item: LootItem; quantity: number; source: string }>;
    lootByEnemy: Array<{ enemy: string; loot: BattleLoot }>;
  } {
    let totalGold = 0;
    let totalExperience = 0;
    const allItems: Array<{ item: LootItem; quantity: number; source: string }> = [];
    const lootByEnemy: Array<{ enemy: string; loot: BattleLoot }> = [];

    for (const enemy of defeatedEnemies) {
      const enemyLoot = this.generateLootForEnemy(enemy);

      totalGold += enemyLoot.gold;
      totalExperience += enemyLoot.experience;

      for (const itemDrop of enemyLoot.items) {
        allItems.push({
          item: itemDrop.item,
          quantity: itemDrop.quantity,
          source: enemy.name
        });
      }

      lootByEnemy.push({
        enemy: enemy.name,
        loot: enemyLoot
      });
    }

    return {
      totalGold,
      totalExperience,
      allItems,
      lootByEnemy
    };
  }

  // Method to add custom loot tables
  addLootTable(enemyType: string, lootTable: EnemyLootTable): void {
    this.lootTables.set(enemyType, lootTable);
  }

  // Method to add custom items
  addItem(item: LootItem): void {
    this.availableItems.set(item.id, item);
  }

  // Method to get loot table for an enemy type
  getLootTable(enemyType: string): EnemyLootTable | undefined {
    return this.lootTables.get(enemyType);
  }

  // Method to get all available items
  getAvailableItems(): Map<string, LootItem> {
    return new Map(this.availableItems);
  }

  // Method to calculate loot value
  calculateLootValue(loot: BattleLoot): number {
    let totalValue = loot.gold;

    for (const itemDrop of loot.items) {
      totalValue += itemDrop.item.value * itemDrop.quantity;
    }

    return totalValue;
  }
}