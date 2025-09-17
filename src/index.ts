// Main exports - Clean Architecture layers

// Domain layer
export * as Entities from './entities';

// Business logic layer
export * as UseCases from './use-cases';

// Data access layer
export * as Repositories from './repositories';

// Presentation layer
// export * as Controllers from './controllers'; // Will be uncommented when controllers are implemented

// Infrastructure layer
export * as Infrastructure from './infrastructure';

// Legacy code (to be migrated)
export * from './loaders';
export * from './systems';
export * from './utils';