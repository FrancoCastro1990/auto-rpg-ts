import { testConfig } from './IntegrationTestConfig';

// Configure test environment for integration tests
// This overrides any global mocks for integration testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-integration';
process.env.MONGODB_URI = 'mongodb://localhost:27017/auto-rpg-integration-test';

// Setup global test configuration
beforeAll(async () => {
  await testConfig.setup();
}, 60000); // 60 seconds timeout for setup

afterAll(async () => {
  await testConfig.teardown();
}, 60000); // 60 seconds timeout for teardown

// Clear database between tests
beforeEach(async () => {
  await testConfig.clearDatabase();
});