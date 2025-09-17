import {
  IPlayer,
  IParty,
  ICharacter,
  IDungeon,
  ICombatResult
} from '../entities/interfaces';

// Use case interfaces - Business logic contracts

// Player use cases
export interface ICreatePlayerUseCase {
  execute(data: { username: string }): Promise<IPlayer>;
}

export interface IGetPlayerUseCase {
  execute(id: string): Promise<IPlayer | null>;
}

export interface IUpdatePlayerExperienceUseCase {
  execute(id: string, experience: number): Promise<IPlayer | null>;
}

export interface IGetPlayerLeaderboardUseCase {
  execute(limit?: number): Promise<IPlayer[]>;
}

// Party use cases
export interface ICreatePartyUseCase {
  execute(data: { playerId: string; name: string; characters: ICharacter[] }): Promise<IParty>;
}

export interface IGetPartyUseCase {
  execute(id: string): Promise<IParty | null>;
}

export interface IGetPlayerPartiesUseCase {
  execute(playerId: string): Promise<IParty[]>;
}

export interface IUpdatePartyUseCase {
  execute(id: string, data: Partial<IParty>): Promise<IParty | null>;
}

export interface IDeletePartyUseCase {
  execute(id: string): Promise<boolean>;
}

// Dungeon use cases
export interface ICreateDungeonUseCase {
  execute(data: Omit<IDungeon, 'id' | 'createdAt' | 'updatedAt'>): Promise<IDungeon>;
}

export interface IGetDungeonUseCase {
  execute(id: string): Promise<IDungeon | null>;
}

export interface IGetDungeonsUseCase {
  execute(filters?: { difficulty?: number; minLevel?: number }): Promise<IDungeon[]>;
}

export interface IUpdateDungeonUseCase {
  execute(id: string, data: Partial<IDungeon>): Promise<IDungeon | null>;
}

export interface IDeleteDungeonUseCase {
  execute(id: string): Promise<boolean>;
}

// Combat use cases
export interface IGenerateCombatUseCase {
  execute(data: { partyId: string; dungeonId: string }): Promise<ICombatResult>;
}

export interface IGetCombatResultUseCase {
  execute(id: string): Promise<ICombatResult | null>;
}

export interface IGetPlayerCombatHistoryUseCase {
  execute(playerId: string, limit?: number): Promise<ICombatResult[]>;
}