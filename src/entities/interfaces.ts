// Domain entities interfaces - Pure business logic, no external dependencies

// Value objects
export interface IStats {
  hp: number;
  mp: number;
  str: number;
  def: number;
  mag: number;
  spd: number;
}

export interface IExperience {
  current: number;
  nextLevel: number;
  total: number;
}

// Core entities
export interface IPlayer {
  id: string;
  username: string;
  level: number;
  experience: IExperience;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICharacter {
  id: string;
  name: string;
  job: string;
  level: number;
  stats: IStats;
  skills: string[];
  rules: IRule[];
}

export interface IRule {
  id: string;
  priority: number;
  condition: string;
  target: string;
  action: string;
}

export interface IParty {
  id: string;
  playerId: string;
  name: string;
  characters: ICharacter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBattle {
  id: string;
  enemies: ICharacter[];
  rewards: IReward;
  order: number;
}

export interface IReward {
  gold: number;
  experience: number;
  items: IItem[];
}

export interface IItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  value: number;
}

export interface IDungeon {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  minLevel: number;
  battles: IBattle[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBattleResult {
  id: string;
  battleId: string;
  partyId: string;
  dungeonId: string;
  victory: boolean;
  duration: number;
  rewards: IReward;
  log: string[];
  createdAt: Date;
}

export interface ICombatResult {
  id: string;
  partyId: string;
  dungeonId: string;
  totalBattles: number;
  victories: number;
  totalDuration: number;
  totalRewards: IReward;
  battleResults: IBattleResult[];
  createdAt: Date;
}

// Authentication entities
export interface IUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | undefined;
}