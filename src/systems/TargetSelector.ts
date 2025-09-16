import { BattleParticipant } from '../models/types';

export type TargetType =
  | 'self'
  | 'weakestEnemy'
  | 'lowestHpEnemy'
  | 'strongestEnemy'
  | 'randomEnemy'
  | 'bossEnemy'
  | 'lowestHpAlly'
  | 'randomAlly'
  | 'strongestAlly'
  | 'highestMpAlly';

export interface TargetSelectionResult {
  target: BattleParticipant | null;
  reason: string;
  alternatives: BattleParticipant[];
}

export class TargetSelector {

  static selectTarget(
    targetType: TargetType,
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): TargetSelectionResult {
    const livingAllies = allies.filter(ally => ally.isAlive);
    const livingEnemies = enemies.filter(enemy => enemy.isAlive);

    switch (targetType) {
      case 'self':
        return {
          target: actor,
          reason: 'Targeting self',
          alternatives: []
        };

      case 'weakestEnemy':
      case 'lowestHpEnemy':
        return this.selectWeakestEnemy(livingEnemies);

      case 'strongestEnemy':
        return this.selectStrongestEnemy(livingEnemies);

      case 'randomEnemy':
        return this.selectRandomEnemy(livingEnemies);

      case 'bossEnemy':
        return this.selectBossEnemy(livingEnemies);

      case 'lowestHpAlly':
        return this.selectLowestHpAlly(actor, livingAllies);

      case 'randomAlly':
        return this.selectRandomAlly(actor, livingAllies);

      case 'strongestAlly':
        return this.selectStrongestAlly(actor, livingAllies);

      case 'highestMpAlly':
        return this.selectHighestMpAlly(actor, livingAllies);

      default:
        return {
          target: null,
          reason: `Unknown target type: ${targetType}`,
          alternatives: []
        };
    }
  }

  private static selectWeakestEnemy(enemies: BattleParticipant[]): TargetSelectionResult {
    if (enemies.length === 0) {
      return {
        target: null,
        reason: 'No living enemies available',
        alternatives: []
      };
    }

    const weakest = enemies.reduce((prev, current) =>
      current.currentStats.hp < prev.currentStats.hp ? current : prev
    );

    const alternatives = enemies.filter(e => e.id !== weakest.id);

    return {
      target: weakest,
      reason: `Selected weakest enemy with ${weakest.currentStats.hp} HP`,
      alternatives
    };
  }

  private static selectStrongestEnemy(enemies: BattleParticipant[]): TargetSelectionResult {
    if (enemies.length === 0) {
      return {
        target: null,
        reason: 'No living enemies available',
        alternatives: []
      };
    }

    const strongest = enemies.reduce((prev, current) =>
      current.currentStats.hp > prev.currentStats.hp ? current : prev
    );

    const alternatives = enemies.filter(e => e.id !== strongest.id);

    return {
      target: strongest,
      reason: `Selected strongest enemy with ${strongest.currentStats.hp} HP`,
      alternatives
    };
  }

  private static selectRandomEnemy(enemies: BattleParticipant[]): TargetSelectionResult {
    if (enemies.length === 0) {
      return {
        target: null,
        reason: 'No living enemies available',
        alternatives: []
      };
    }

    const randomIndex = Math.floor(Math.random() * enemies.length);
    const target = enemies[randomIndex];
    const alternatives = enemies.filter(e => e.id !== target!.id);

    return {
      target: target!,
      reason: `Randomly selected enemy ${target!.name}`,
      alternatives
    };
  }

  private static selectBossEnemy(enemies: BattleParticipant[]): TargetSelectionResult {
    const bosses = enemies.filter(enemy => enemy.isBoss);

    if (bosses.length === 0) {
      if (enemies.length === 0) {
        return {
          target: null,
          reason: 'No living enemies available',
          alternatives: []
        };
      }

      const fallback = this.selectStrongestEnemy(enemies);
      return {
        target: fallback.target,
        reason: 'No boss enemies found, targeting strongest enemy instead',
        alternatives: fallback.alternatives
      };
    }

    const boss = bosses[0];
    const alternatives = enemies.filter(e => e.id !== boss!.id);

    return {
      target: boss!,
      reason: `Selected boss enemy ${boss!.name}`,
      alternatives
    };
  }

  private static selectLowestHpAlly(actor: BattleParticipant, allies: BattleParticipant[]): TargetSelectionResult {
    const allAllies = [actor, ...allies].filter(ally => ally.isAlive);

    if (allAllies.length === 0) {
      return {
        target: null,
        reason: 'No living allies available (including self)',
        alternatives: []
      };
    }

    const lowestHp = allAllies.reduce((prev, current) => {
      const prevPercent = prev.currentStats.hp / prev.maxStats.hp;
      const currentPercent = current.currentStats.hp / current.maxStats.hp;
      return currentPercent < prevPercent ? current : prev;
    });

    const alternatives = allAllies.filter(a => a.id !== lowestHp.id);

    return {
      target: lowestHp,
      reason: `Selected ally with lowest HP: ${lowestHp.name} (${lowestHp.currentStats.hp}/${lowestHp.maxStats.hp})`,
      alternatives
    };
  }

  private static selectRandomAlly(actor: BattleParticipant, allies: BattleParticipant[]): TargetSelectionResult {
    const allAllies = [actor, ...allies].filter(ally => ally.isAlive);

    if (allAllies.length === 0) {
      return {
        target: null,
        reason: 'No living allies available (including self)',
        alternatives: []
      };
    }

    const randomIndex = Math.floor(Math.random() * allAllies.length);
    const target = allAllies[randomIndex];
    const alternatives = allAllies.filter(a => a.id !== target!.id);

    return {
      target: target!,
      reason: `Randomly selected ally ${target!.name}`,
      alternatives
    };
  }

  private static selectStrongestAlly(actor: BattleParticipant, allies: BattleParticipant[]): TargetSelectionResult {
    const allAllies = [actor, ...allies].filter(ally => ally.isAlive);

    if (allAllies.length === 0) {
      return {
        target: null,
        reason: 'No living allies available (including self)',
        alternatives: []
      };
    }

    const strongest = allAllies.reduce((prev, current) =>
      current.currentStats.hp > prev.currentStats.hp ? current : prev
    );

    const alternatives = allAllies.filter(a => a.id !== strongest.id);

    return {
      target: strongest,
      reason: `Selected strongest ally with ${strongest.currentStats.hp} HP`,
      alternatives
    };
  }

  private static selectHighestMpAlly(actor: BattleParticipant, allies: BattleParticipant[]): TargetSelectionResult {
    const allAllies = [actor, ...allies].filter(ally => ally.isAlive);

    if (allAllies.length === 0) {
      return {
        target: null,
        reason: 'No living allies available (including self)',
        alternatives: []
      };
    }

    const highestMp = allAllies.reduce((prev, current) =>
      current.currentStats.mp > prev.currentStats.mp ? current : prev
    );

    const alternatives = allAllies.filter(a => a.id !== highestMp.id);

    return {
      target: highestMp,
      reason: `Selected ally with highest MP: ${highestMp.name} (${highestMp.currentStats.mp}/${highestMp.maxStats.mp})`,
      alternatives
    };
  }

  static getAllValidTargets(
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): Record<TargetType, TargetSelectionResult> {
    const targetTypes: TargetType[] = [
      'self', 'weakestEnemy', 'lowestHpEnemy', 'strongestEnemy', 'randomEnemy',
      'bossEnemy', 'lowestHpAlly', 'randomAlly', 'strongestAlly', 'highestMpAlly'
    ];

    const results: Record<string, TargetSelectionResult> = {};

    for (const targetType of targetTypes) {
      results[targetType] = this.selectTarget(targetType, actor, allies, enemies);
    }

    return results as Record<TargetType, TargetSelectionResult>;
  }

  static validateTargetType(targetType: string): targetType is TargetType {
    const validTargets: TargetType[] = [
      'self', 'weakestEnemy', 'lowestHpEnemy', 'strongestEnemy', 'randomEnemy',
      'bossEnemy', 'lowestHpAlly', 'randomAlly', 'strongestAlly', 'highestMpAlly'
    ];

    return validTargets.includes(targetType as TargetType);
  }

  static getTargetDescription(targetType: TargetType): string {
    const descriptions: Record<TargetType, string> = {
      'self': 'Target self',
      'weakestEnemy': 'Target enemy with lowest current HP',
      'lowestHpEnemy': 'Target enemy with lowest current HP (alias)',
      'strongestEnemy': 'Target enemy with highest current HP',
      'randomEnemy': 'Target random living enemy',
      'bossEnemy': 'Target boss enemy (fallback to strongest if no boss)',
      'lowestHpAlly': 'Target ally with lowest HP percentage (including self)',
      'randomAlly': 'Target random living ally (including self)',
      'strongestAlly': 'Target ally with highest current HP',
      'highestMpAlly': 'Target ally with highest current MP'
    };

    return descriptions[targetType] || 'Unknown target type';
  }

  static suggestOptimalTarget(
    action: 'attack' | 'heal' | 'buff' | 'debuff',
    actor: BattleParticipant,
    allies: BattleParticipant[],
    enemies: BattleParticipant[]
  ): TargetSelectionResult {
    switch (action) {
      case 'attack':
        const livingEnemies = enemies.filter(e => e.isAlive);
        if (livingEnemies.some(e => e.isBoss)) {
          return this.selectTarget('bossEnemy', actor, allies, enemies);
        }
        return this.selectTarget('weakestEnemy', actor, allies, enemies);

      case 'heal':
        return this.selectTarget('lowestHpAlly', actor, allies, enemies);

      case 'buff':
        return this.selectTarget('strongestAlly', actor, allies, enemies);

      case 'debuff':
        return this.selectTarget('strongestEnemy', actor, allies, enemies);

      default:
        return {
          target: null,
          reason: `Unknown action type: ${action}`,
          alternatives: []
        };
    }
  }
}