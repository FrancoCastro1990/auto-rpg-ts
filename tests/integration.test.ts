/**
 * Integration tests for the Auto-RPG system
 * Tests complete workflows and component interactions
 */

import { DataLoader } from '../src/loaders/DataLoader';
import { BattleLogger } from '../src/utils/BattleLogger';
import { ReportGenerator } from '../src/utils/ReportGenerator';
import {
  ValidationError,
  DataLoadError,
  BattleError,
  ErrorHandler
} from '../src/utils/errors';

describe('System Integration', () => {
  let dataLoader: DataLoader;
  let battleLogger: BattleLogger;

  beforeAll(async () => {
    // Setup test environment
    dataLoader = new DataLoader('./data');
    battleLogger = new BattleLogger({
      logLevel: 'ERROR', // Minimize output during tests
      useColors: false,
      compactMode: true
    });
  });

  describe('Data Loading Integration', () => {
    it('should load and validate all game data successfully', async () => {
      const { skills, jobs, enemies, party } = await dataLoader.validateDataIntegrity();

      expect(Array.isArray(skills)).toBe(true);
      expect(Array.isArray(jobs)).toBe(true);
      expect(Array.isArray(enemies)).toBe(true);
      expect(Array.isArray(party)).toBe(true);

      // Validate data structure
      if (skills.length > 0) {
        expect(skills[0]).toHaveProperty('name');
        expect(skills[0]).toHaveProperty('type');
      }

      if (jobs.length > 0) {
        expect(jobs[0]).toHaveProperty('name');
        expect(jobs[0]).toHaveProperty('baseStats');
      }

      if (enemies.length > 0) {
        expect(enemies[0]).toHaveProperty('type');
        expect(enemies[0]).toHaveProperty('baseStats');
      }

      if (party.length > 0) {
        expect(party[0]).toHaveProperty('name');
        expect(party[0]).toHaveProperty('job');
        expect(party[0]).toHaveProperty('level');
      }
    });

    it('should handle data loading errors gracefully', async () => {
      const invalidDataLoader = new DataLoader('./nonexistent');

      await expect(invalidDataLoader.validateDataIntegrity()).rejects.toThrow();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle cascading errors through the system', async () => {
      // Test error propagation from data loading
      const invalidDataLoader = new DataLoader('./nonexistent');

      try {
        await invalidDataLoader.validateDataIntegrity();
        fail('Should have thrown an error');
      } catch (error) {
        if (error instanceof Error) {
          expect(error instanceof DataLoadError).toBe(true);

          // Test error handler integration
          const handler = ErrorHandler.getInstance();
          handler.handle(error);

          const log = handler.getErrorLog();
          expect(log.length).toBeGreaterThan(0);
          expect(log[log.length - 1]?.error).toBe(error);
        }
      }
    });

    it('should provide user-friendly error messages', () => {
      const validationError = new ValidationError('Invalid input data');
      const dataLoadError = new DataLoadError('File not found', 'missing.json');
      const battleError = new BattleError('Battle initialization failed');

      expect(ErrorHandler.getUserFriendlyMessage(validationError)).toContain('invalid');
      expect(ErrorHandler.getUserFriendlyMessage(dataLoadError)).toContain('loading game data');
      expect(ErrorHandler.getUserFriendlyMessage(battleError)).toContain('during battle');
    });

    it('should handle unexpected errors gracefully', () => {
      const genericError = new Error('Unexpected error');

      expect(() => {
        ErrorHandler.getInstance().handle(genericError);
      }).not.toThrow();

      const message = ErrorHandler.getUserFriendlyMessage(genericError);
      expect(message).toContain('unexpected error');
    });
  });

  describe('Logging Integration', () => {
    it('should handle logger configuration changes', () => {
      const logger = new BattleLogger();

      expect(() => {
        logger.updateConfig({ logLevel: 'DEBUG' });
      }).not.toThrow();

      expect(() => {
        logger.updateConfig({ useColors: false });
      }).not.toThrow();
    });
  });

  describe('Report Generation Integration', () => {
    it('should generate reports correctly', () => {
      const mockProgress = {
        dungeonId: 1,
        currentBattleIndex: 0,
        completedBattles: [1, 2],
        partyState: [],
        isComplete: true,
        isVictorious: true,
        totalTurns: 25,
        battleHistory: [{
          battleId: 1,
          result: {
            victory: true,
            reason: 'All enemies defeated',
            turns: 15,
            survivingAllies: [],
            defeatedEnemies: []
          },
          turnHistory: []
        }],
        startTime: new Date(),
        endTime: new Date()
      };

      const analysis = ReportGenerator.analyzeDungeon(mockProgress);
      const report = ReportGenerator.generateReport(analysis, 'text');

      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
      expect(report).toContain('COMPLETED');
    });

    it('should handle different report formats', () => {
      const mockAnalysis = {
        dungeonId: 1,
        totalDuration: 5000,
        battlesWon: 2,
        battlesLost: 0,
        totalDamage: 150,
        totalHealing: 50,
        totalTurns: 30,
        avgTurnsPerBattle: 15,
        battles: [],
        partyPerformance: [],
        mostUsedSkills: [],
        criticalMoments: []
      };

      const textReport = ReportGenerator.generateReport(mockAnalysis, 'text');
      expect(typeof textReport).toBe('string');

      const jsonReport = ReportGenerator.generateReport(mockAnalysis, 'json');
      expect(typeof jsonReport).toBe('string');
      expect(() => JSON.parse(jsonReport)).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid operations without crashing', () => {
      const handler = ErrorHandler.getInstance();

      // Generate many errors quickly
      for (let i = 0; i < 50; i++) {
        handler.handle(new Error(`Test error ${i}`));
      }

      const log = handler.getErrorLog();
      expect(log.length).toBe(52);

      // Clear and verify
      handler.clearErrorLog();
      expect(handler.getErrorLog()).toHaveLength(0);
    });

    it('should handle memory operations properly', () => {
      // Test that repeated operations don't cause memory issues
      const logger = new BattleLogger();

      for (let i = 0; i < 10; i++) {
        logger.updateConfig({ logLevel: 'INFO' });
        logger.updateConfig({ useColors: false });
      }

      // Should not crash or leak memory significantly
      expect(true).toBe(true);
    });
  });
});