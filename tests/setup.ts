import { jest } from '@jest/globals';

// Extend global type for test utilities
declare global {
  var testUtils: {
    createMockParticipant: (overrides?: any) => any;
    createMockRule: (overrides?: any) => any;
    createMockAbility: (overrides?: any) => any;
    createMockStats: (overrides?: any) => any;
    wait: (ms: number) => Promise<void>;
    createMockLogger: () => any;
  };
}

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  // Keep log and warn for debugging, but suppress info and debug in CI
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock process.env for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/auto-rpg-test';

// Mock external dependencies
jest.mock('mongoose', () => ({
  connect: jest.fn(() => Promise.resolve({})),
  connection: {
    readyState: 1,
    close: jest.fn(() => Promise.resolve({}))
  },
  model: jest.fn(),
  Schema: jest.fn().mockImplementation((definition: any) => ({
    pre: jest.fn(),
    post: jest.fn(),
    methods: {},
    statics: {},
    virtual: jest.fn().mockReturnThis(),
    index: jest.fn().mockReturnThis()
  }))
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true))
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user-id', role: 'user' }))
}));

jest.mock('chalk', () => ({
  red: jest.fn((text: string) => text),
  green: jest.fn((text: string) => text),
  blue: jest.fn((text: string) => text),
  yellow: jest.fn((text: string) => text),
  cyan: jest.fn((text: string) => text),
  magenta: jest.fn((text: string) => text),
  gray: jest.fn((text: string) => text),
  bold: jest.fn((text: string) => `[BOLD]${text}[/BOLD]`)
}));

// Mock json-rules-engine
jest.mock('json-rules-engine', () => ({
  Engine: jest.fn().mockImplementation(() => ({
    addOperator: jest.fn(),
    addRule: jest.fn(),
    run: jest.fn(() => Promise.resolve([])),
    addFact: jest.fn()
  }))
}));

// Global test utilities
global.testUtils = {
  // Create mock battle participant
  createMockParticipant: (overrides = {}) => ({
    id: 'test-participant-id',
    name: 'Test Participant',
    job: 'Warrior',
    level: 1,
    currentStats: {
      hp: 100,
      mp: 50,
      str: 10,
      def: 5,
      mag: 3,
      spd: 8
    },
    maxStats: {
      hp: 100,
      mp: 50,
      str: 10,
      def: 5,
      mag: 3,
      spd: 8
    },
    baseStats: {
      hp: 100,
      mp: 50,
      str: 10,
      def: 5,
      mag: 3,
      spd: 8
    },
    abilities: [],
    rules: [],
    buffs: [],
    skillCooldowns: [],
    isAlive: true,
    isEnemy: false,
    isBoss: false,
    ...overrides
  }),

  // Create mock rule
  createMockRule: (overrides = {}) => ({
    priority: 1,
    condition: 'always',
    target: 'weakestEnemy',
    action: 'attack',
    ...overrides
  }),

  // Create mock ability
  createMockAbility: (overrides = {}) => ({
    name: 'test_skill',
    displayName: 'Test Skill',
    description: 'A test skill',
    type: 'active',
    mpCost: 10,
    power: 50,
    accuracy: 95,
    effects: [],
    ...overrides
  }),

  // Create mock stats
  createMockStats: (overrides = {}) => ({
    hp: 100,
    mp: 50,
    str: 10,
    def: 5,
    mag: 3,
    spd: 8,
    ...overrides
  }),

  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock logger
  createMockLogger: () => ({
    log: jest.fn(),
    logError: jest.fn(),
    logWarning: jest.fn(),
    logDebug: jest.fn(),
    logVerbose: jest.fn()
  })
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
  // Close any open connections
  await new Promise(resolve => setTimeout(resolve, 100));
});