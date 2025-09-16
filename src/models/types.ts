export interface Stats {
  hp: number;
  mp: number;
  str: number;
  def: number;
  mag: number;
  spd: number;
}

export interface Ability {
  name: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff';
  effect: {
    damage?: number;
    heal?: number;
    statModifier?: Partial<Stats>;
    duration?: number;
  };
  mpCost: number;
  description?: string;
}

export interface Rule {
  priority: number;
  condition: string;
  target: string;
  action: string;
}

export interface Buff {
  name: string;
  type: 'buff' | 'debuff';
  statModifier: Partial<Stats>;
  duration: number;
  remainingTurns: number;
}

export interface Character {
  id: string;
  name: string;
  job: string;
  level: number;
  currentStats: Stats;
  maxStats: Stats;
  baseStats: Stats;
  abilities: Ability[];
  rules: Rule[];
  buffs: Buff[];
  isAlive: boolean;
  isEnemy: boolean;
}

export interface Job {
  name: string;
  baseStats: Stats;
  skillIds: string[];
  description?: string;
}

export interface Enemy {
  type: string;
  job: string;
  baseStats: Stats;
  rules: Rule[];
  skillIds?: string[];
  isBoss?: boolean;
  description?: string;
}

export interface EnemyInstance {
  id: string;
  name: string;
  type: string;
  job: string;
  currentStats: Stats;
  maxStats: Stats;
  baseStats: Stats;
  abilities: Ability[];
  rules: Rule[];
  buffs: Buff[];
  isAlive: boolean;
  isEnemy: boolean;
  isBoss: boolean;
}

export interface BattleParticipant {
  id: string;
  name: string;
  currentStats: Stats;
  maxStats: Stats;
  abilities: Ability[];
  rules: Rule[];
  buffs: Buff[];
  isAlive: boolean;
  isEnemy: boolean;
  isBoss?: boolean;
}

export interface Action {
  actorId: string;
  actorName: string;
  type: 'attack' | 'ability' | 'skip';
  targetId?: string;
  targetName?: string;
  abilityName?: string;
  damage?: number;
  heal?: number;
  success: boolean;
  message: string;
}

export interface BattleResult {
  victory: boolean;
  reason: string;
  turns: number;
  survivingAllies: Character[];
  defeatedEnemies: EnemyInstance[];
}

export interface Battle {
  id: number;
  order: number;
  enemies: Array<{
    type: string;
    name?: string;
  }>;
  maxTurns?: number;
}

export interface Dungeon {
  id: number;
  name: string;
  description?: string;
  battles: Battle[];
  defaultMaxTurns?: number;
}

export interface PartyMember {
  name: string;
  job: string;
  level: number;
  rules: Rule[];
}

export type TargetType =
  | 'weakestEnemy'
  | 'strongestEnemy'
  | 'lowestHpAlly'
  | 'randomAlly'
  | 'randomEnemy'
  | 'bossEnemy'
  | 'self';

export type ConditionType =
  | 'always'
  | 'enemy.isBoss'
  | 'ally.hp < 30%'
  | 'self.mp > 50%'
  | 'enemy.count > 1';