// Dependency injection container - Simple implementation for Clean Architecture

import { IPlayerRepository } from '../repositories/interfaces';
import { ICreatePlayerUseCase } from '../use-cases/interfaces';

// Repository instances (will be implemented later)
let playerRepository: IPlayerRepository;

// Use case instances
let createPlayerUseCase: ICreatePlayerUseCase;

// Repository setters
export const setPlayerRepository = (repo: IPlayerRepository) => {
  playerRepository = repo;
};

// Use case getters
export const getPlayerRepository = (): IPlayerRepository => {
  if (!playerRepository) {
    throw new Error('PlayerRepository not initialized. Call setPlayerRepository first.');
  }
  return playerRepository;
};

// Factory functions for use cases
export const createPlayerUseCaseFactory = (): ICreatePlayerUseCase => {
  if (!createPlayerUseCase) {
    // This will be implemented when we create the actual use case
    throw new Error('CreatePlayerUseCase not implemented yet');
  }
  return createPlayerUseCase;
};

// Initialization function
export const initializeDependencies = () => {
  console.log('🔧 Initializing dependency injection container...');
  // This will be called after all implementations are ready
};

// Cleanup function
export const resetDependencies = () => {
  playerRepository = undefined as any;
  createPlayerUseCase = undefined as any;
  console.log('🧹 Dependency injection container reset');
};