import { IParty, ICharacter, IDungeon } from '../entities/interfaces';
import { EntityFactory } from '../loaders/EntityFactory';
import { Character, EnemyInstance } from '../models/types';

export class BattleSystemAdapter {
  constructor(private entityFactory: EntityFactory) {}

  /**
   * Convert domain Party to BattleSystem Character format
   */
  convertPartyToCharacters(party: IParty): Character[] {
    return party.characters.map(character => this.convertCharacter(character));
  }

  /**
   * Convert domain Character to BattleSystem Character format
   */
  private convertCharacter(character: ICharacter): Character {
    // Create character using EntityFactory
    const partyMember = {
      name: character.name,
      job: character.job,
      level: character.level,
      rules: character.rules.map(rule => ({
        priority: rule.priority,
        condition: rule.condition,
        target: rule.target,
        action: rule.action
      }))
    };

    return this.entityFactory.createCharacter(partyMember);
  }

  /**
   * Convert dungeon battle enemies to BattleSystem EnemyInstance format
   */
  convertDungeonBattleToEnemies(dungeon: IDungeon, battleIndex: number = 0): EnemyInstance[] {
    if (battleIndex >= dungeon.battles.length) {
      throw new Error(`Battle index ${battleIndex} is out of range for dungeon ${dungeon.name}`);
    }

    const battle = dungeon.battles[battleIndex];
    if (!battle) {
      throw new Error(`Battle at index ${battleIndex} is undefined for dungeon ${dungeon.name}`);
    }

    // Convert ICharacter[] to the format expected by EntityFactory
    const battleEnemies = battle.enemies.map(enemy => ({
      type: enemy.job, // Use job as enemy type for now
      name: enemy.name
    }));

    // Calculate enemy level based on dungeon difficulty
    const enemyLevel = Math.max(1, Math.floor(dungeon.minLevel * (1 + dungeon.difficulty * 0.2)));

    return this.entityFactory.createEnemiesFromBattle(battleEnemies, enemyLevel);
  }

  /**
   * Get battle configuration from dungeon
   */
  getBattleConfig(dungeon: IDungeon, battleIndex: number = 0) {
    if (battleIndex >= dungeon.battles.length) {
      throw new Error(`Battle index ${battleIndex} is out of range for dungeon ${dungeon.name}`);
    }

    const battle = dungeon.battles[battleIndex];
    if (!battle) {
      throw new Error(`Battle at index ${battleIndex} is undefined for dungeon ${dungeon.name}`);
    }

    return {
      id: battle.id,
      maxTurns: dungeon.minLevel * 10, // Default max turns based on dungeon level
      enemyLevel: Math.max(1, Math.floor(dungeon.minLevel * (1 + dungeon.difficulty * 0.2)))
    };
  }
}