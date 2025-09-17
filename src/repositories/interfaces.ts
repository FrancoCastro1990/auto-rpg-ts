import {
  IPlayer,
  IParty,
  ICharacter,
  IDungeon,
  IBattleResult,
  ICombatResult,
  IUser
} from '../entities/interfaces';
import { IBaseRepository } from './IBaseRepository';

// Player repository interface
export interface IPlayerRepository extends IBaseRepository<IPlayer> {
  findByUsername(username: string): Promise<IPlayer | null>;
  updateExperience(id: string, experience: number): Promise<IPlayer | null>;
  findByLevel(level: number): Promise<IPlayer[]>;
  getLeaderboard(limit?: number): Promise<IPlayer[]>;
}

// Party repository interface
export interface IPartyRepository extends IBaseRepository<IParty> {
  findByPlayerId(playerId: string): Promise<IParty[]>;
  findActiveParties(): Promise<IParty[]>;
  updateCharacters(id: string, characters: ICharacter[]): Promise<IParty | null>;
  countByPlayerId(playerId: string): Promise<number>;
}

// Dungeon repository interface
export interface IDungeonRepository extends IBaseRepository<IDungeon> {
  findByDifficulty(difficulty: number): Promise<IDungeon[]>;
  findByName(name: string): Promise<IDungeon | null>;
  findAvailableForPlayer(playerLevel: number): Promise<IDungeon[]>;
  updateBattleResults(id: string, battleResults: IBattleResult[]): Promise<IDungeon | null>;
}

// Combat result repository interface
export interface ICombatResultRepository extends IBaseRepository<ICombatResult> {
  findByPartyId(partyId: string): Promise<ICombatResult[]>;
  findByDungeonId(dungeonId: string): Promise<ICombatResult[]>;
  findByPlayerId(playerId: string): Promise<ICombatResult[]>;
  getRecentResults(limit?: number): Promise<ICombatResult[]>;
}

// User repository interface for authentication
export interface IUserRepository extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  findActiveUsers(): Promise<IUser[]>;
  updateLastLogin(id: string): Promise<IUser | null>;
  deactivateUser(id: string): Promise<IUser | null>;
}