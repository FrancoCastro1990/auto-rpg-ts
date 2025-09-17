import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Application } from 'express';
import request from 'supertest';
import { createApp, initializeTestDependencies } from '../../src/server';
import { UserRepository } from '../../src/repositories/UserRepository';
import { PartyRepository } from '../../src/repositories/PartyRepository';
import { DungeonRepository } from '../../src/repositories/DungeonRepository';
import { CombatResultRepository } from '../../src/repositories/CombatResultRepository';

/**
 * Integration Test Configuration
 * Provides utilities for setting up and tearing down integration tests
 * with isolated MongoDB memory server and test application instance
 */
export class IntegrationTestConfig {
  private mongoServer?: MongoMemoryServer;
  private app?: Application;
  private repositories?: {
    user: UserRepository;
    party: PartyRepository;
    dungeon: DungeonRepository;
    combatResult: CombatResultRepository;
  };

  /**
   * Setup test environment before all tests
   */
  async setup(): Promise<void> {
    // Start in-memory MongoDB server
    this.mongoServer = await MongoMemoryServer.create();
    const mongoUri = this.mongoServer.getUri();

    // Connect to test database
    await mongoose.connect(mongoUri);

    // Initialize repositories directly (without starting the full server)
    const dependencies = await initializeTestDependencies();
    this.repositories = {
      user: dependencies.userRepository,
      party: dependencies.partyRepository,
      dungeon: dependencies.dungeonRepository,
      combatResult: dependencies.combatResultRepository,
    };
  }

  /**
   * Cleanup test environment after all tests
   */
  async teardown(): Promise<void> {
    // Disconnect from database
    await mongoose.disconnect();

    // Stop MongoDB memory server
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
  }

  /**
   * Clear all collections between tests
   */
  async clearDatabase(): Promise<void> {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  }

  /**
   * Get test application instance (creates it if needed)
   */
  async getApp(): Promise<Application> {
    if (!this.app) {
      this.app = await createApp();
    }
    return this.app;
  }

  /**
   * Get supertest agent for API testing
   */
  async getAgent() {
    const app = await this.getApp();
    return request(app);
  }

  /**
   * Get repositories for direct database testing
   */
  getRepositories() {
    if (!this.repositories) {
      throw new Error('Repositories not initialized. Call setup() first.');
    }
    return this.repositories;
  }

  /**
   * Create test user and return auth token
   */
  async createTestUser(email = 'test@example.com', password = 'password123'): Promise<string> {
    const agent = await this.getAgent();

    const response = await agent
      .post('/api/auth/register')
      .send({
        email,
        password,
        username: 'testuser'
      });

    if (response.status !== 201) {
      throw new Error(`Failed to create test user: ${response.text}`);
    }

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({
        email,
        password
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login test user: ${loginResponse.text}`);
    }

    return loginResponse.body.token;
  }
}

// Global test configuration instance
export const testConfig = new IntegrationTestConfig();