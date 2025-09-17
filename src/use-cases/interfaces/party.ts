// Use Case interfaces for Party operations

export interface ICreatePartyRequest {
  playerId: string;
  name: string;
  characterIds: string[];
}

export interface ICreatePartyResponse {
  success: boolean;
  party?: any;
  error?: string;
}

export interface IUpdatePartyRequest {
  partyId: string;
  playerId: string;
  name?: string;
  characterIds?: string[];
}

export interface IUpdatePartyResponse {
  success: boolean;
  party?: any;
  error?: string;
}

export interface IDeletePartyRequest {
  partyId: string;
  playerId: string;
}

export interface IDeletePartyResponse {
  success: boolean;
  error?: string;
}

export interface IGetPartyRequest {
  partyId?: string;
  playerId?: string;
  includeInactive?: boolean;
}

export interface IGetPartyResponse {
  success: boolean;
  party?: any;
  parties?: any[];
  error?: string;
}

export interface IGetPartiesByPlayerRequest {
  playerId: string;
  includeInactive?: boolean;
}

export interface IGetPartiesByPlayerResponse {
  success: boolean;
  parties?: any[];
  error?: string;
}