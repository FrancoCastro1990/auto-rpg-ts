/**
 * Unit tests for the error handling system
 * Tests custom error classes, validation utilities, and error handler
 */

import {
  GameError,
  ValidationError,
  DataLoadError,
  BattleError,
  ConfigurationError,
  CombatDataExportError,
  ErrorHandler,
  Validator
} from '../src/utils/errors';

describe('Error Classes', () => {
  describe('GameError', () => {
    it('should create a GameError with correct properties', () => {
      const error = new GameError('Test error', 'TEST_ERROR', { test: 'data' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toEqual({ test: 'data' });
      expect(error.name).toBe('GameError');
    });

    it('should create a GameError without context', () => {
      const error = new GameError('Test error', 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input', { field: 'name' });

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context).toEqual({ field: 'name' });
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('DataLoadError', () => {
    it('should create a DataLoadError with file information', () => {
      const error = new DataLoadError('File not found', 'test.json', { attempt: 1 });

      expect(error.message).toBe('File not found');
      expect(error.code).toBe('DATA_LOAD_ERROR');
      expect(error.file).toBe('test.json');
      expect(error.context).toEqual({ file: 'test.json', attempt: 1 });
      expect(error.name).toBe('DataLoadError');
    });
  });

  describe('BattleError', () => {
    it('should create a BattleError with battle ID', () => {
      const error = new BattleError('Battle failed', 123, { turn: 5 });

      expect(error.message).toBe('Battle failed');
      expect(error.code).toBe('BATTLE_ERROR');
      expect(error.battleId).toBe(123);
      expect(error.context).toEqual({ battleId: 123, turn: 5 });
      expect(error.name).toBe('BattleError');
    });
  });

  describe('ConfigurationError', () => {
    it('should create a ConfigurationError with option information', () => {
      const error = new ConfigurationError('Invalid option', 'maxTurns', { value: -1 });

      expect(error.message).toBe('Invalid option');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.option).toBe('maxTurns');
      expect(error.context).toEqual({ option: 'maxTurns', value: -1 });
      expect(error.name).toBe('ConfigurationError');
    });
  });

  describe('CombatDataExportError', () => {
    it('should create a CombatDataExportError with file path', () => {
      const error = new CombatDataExportError('Export failed', 'output.json', { size: '2MB' });

      expect(error.message).toBe('Export failed');
      expect(error.code).toBe('COMBAT_DATA_EXPORT_ERROR');
      expect(error.filePath).toBe('output.json');
      expect(error.context).toEqual({ filePath: 'output.json', size: '2MB' });
      expect(error.name).toBe('CombatDataExportError');
    });
  });
});

describe('Validator', () => {
  describe('isPositiveNumber', () => {
    it('should return the number when valid', () => {
      const result = Validator.isPositiveNumber(5, 'testField');
      expect(result).toBe(5);
    });

    it('should throw ValidationError for negative number', () => {
      expect(() => {
        Validator.isPositiveNumber(-1, 'testField');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for zero', () => {
      expect(() => {
        Validator.isPositiveNumber(0, 'testField');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for NaN', () => {
      expect(() => {
        Validator.isPositiveNumber(NaN, 'testField');
      }).toThrow(ValidationError);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return the string when valid', () => {
      const result = Validator.isNonEmptyString('test', 'testField');
      expect(result).toBe('test');
    });

    it('should trim whitespace', () => {
      const result = Validator.isNonEmptyString('  test  ', 'testField');
      expect(result).toBe('test');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => {
        Validator.isNonEmptyString('', 'testField');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace only', () => {
      expect(() => {
        Validator.isNonEmptyString('   ', 'testField');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string', () => {
      expect(() => {
        Validator.isNonEmptyString(123, 'testField');
      }).toThrow(ValidationError);
    });
  });

  describe('isInRange', () => {
    it('should return the number when in range', () => {
      const result = Validator.isInRange(5, 0, 10, 'testField');
      expect(result).toBe(5);
    });

    it('should throw ValidationError when below minimum', () => {
      expect(() => {
        Validator.isInRange(-1, 0, 10, 'testField');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when above maximum', () => {
      expect(() => {
        Validator.isInRange(15, 0, 10, 'testField');
      }).toThrow(ValidationError);
    });
  });

  describe('isNonEmptyArray', () => {
    it('should return the array when valid', () => {
      const arr = [1, 2, 3];
      const result = Validator.isNonEmptyArray(arr, 'testField');
      expect(result).toBe(arr);
    });

    it('should throw ValidationError for empty array', () => {
      expect(() => {
        Validator.isNonEmptyArray([], 'testField');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-array', () => {
      expect(() => {
        Validator.isNonEmptyArray('not an array', 'testField');
      }).toThrow(ValidationError);
    });
  });
});

describe('ErrorHandler', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    ErrorHandler.getInstance().clearErrorLog();
  });

  describe('handle', () => {
    it('should handle GameError correctly', () => {
      const error = new ValidationError('Test validation error');
      ErrorHandler.getInstance().handle(error);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Validation Error: Test validation error');
    });

    it('should handle generic Error correctly', () => {
      const error = new Error('Generic error');
      ErrorHandler.getInstance().handle(error);

      expect(consoleSpy).toHaveBeenCalledWith('💥 Unexpected Error: Generic error');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for ValidationError', () => {
      const error = new ValidationError('Test');
      const message = ErrorHandler.getUserFriendlyMessage(error);
      expect(message).toBe('Some game data is invalid. Please check your configuration.');
    });

    it('should return user-friendly message for DataLoadError', () => {
      const error = new DataLoadError('Test');
      const message = ErrorHandler.getUserFriendlyMessage(error);
      expect(message).toBe('There was a problem loading game data. Please check your data files.');
    });

    it('should return user-friendly message for generic error', () => {
      const error = new Error('Generic error');
      const message = ErrorHandler.getUserFriendlyMessage(error);
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('error logging', () => {
    it('should log errors with timestamps', () => {
      const error = new Error('Test error');
      const handler = ErrorHandler.getInstance();

      handler.handle(error);

      const log = handler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toBeDefined();
      expect(log[0]!.error).toBe(error);
      expect(log[0]!.timestamp).toBeInstanceOf(Date);
    });

    it('should maintain maximum of 100 errors', () => {
      const handler = ErrorHandler.getInstance();

      // Add 101 errors
      for (let i = 0; i < 101; i++) {
        handler.handle(new Error(`Error ${i}`));
      }

      const log = handler.getErrorLog();
      expect(log).toHaveLength(100);
    });

    it('should clear error log', () => {
      const handler = ErrorHandler.getInstance();
      handler.handle(new Error('Test error'));
      expect(handler.getErrorLog()).toHaveLength(1);

      handler.clearErrorLog();
      expect(handler.getErrorLog()).toHaveLength(0);
    });
  });
});

describe('Error Integration', () => {
  it('should handle error chains correctly', () => {
    try {
      try {
        Validator.isPositiveNumber(-1, 'test');
      } catch (validationError) {
        if (validationError instanceof ValidationError) {
          throw new BattleError('Battle setup failed due to validation', 1, {
            cause: validationError.message
          });
        }
        throw validationError;
      }
    } catch (battleError) {
      if (battleError instanceof BattleError) {
        expect(battleError.message).toBe('Battle setup failed due to validation');
        expect(battleError.context.cause).toContain('must be a positive number');
      } else {
        fail('Expected BattleError');
      }
    }
  });

  it('should preserve error context through handlers', () => {
    const originalError = new DataLoadError('File missing', 'party.json', {
      attemptedPaths: ['/data', '/backup']
    });

    const handler = ErrorHandler.getInstance();
    handler.handle(originalError);

    const log = handler.getErrorLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toBeDefined();
    expect(log[0]!.error).toBe(originalError);
    if (log[0]!.error instanceof DataLoadError) {
      expect(log[0]!.error.context.attemptedPaths).toEqual(['/data', '/backup']);
    }
  });
});