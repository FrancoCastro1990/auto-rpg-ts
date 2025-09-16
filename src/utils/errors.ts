/**
 * Custom error classes for the Auto-RPG game system
 * Provides structured error handling with context and user-friendly messages
 */

export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class ValidationError extends GameError {
  constructor(message: string, context?: any) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class DataLoadError extends GameError {
  constructor(message: string, public readonly file?: string, context?: any) {
    super(message, 'DATA_LOAD_ERROR', { file, ...context });
    this.name = 'DataLoadError';
  }
}

export class BattleError extends GameError {
  constructor(message: string, public readonly battleId?: number, context?: any) {
    super(message, 'BATTLE_ERROR', { battleId, ...context });
    this.name = 'BattleError';
  }
}

export class ConfigurationError extends GameError {
  constructor(message: string, public readonly option?: string, context?: any) {
    super(message, 'CONFIGURATION_ERROR', { option, ...context });
    this.name = 'ConfigurationError';
  }
}

export class CombatDataExportError extends GameError {
  constructor(message: string, public readonly filePath?: string, context?: any) {
    super(message, 'COMBAT_DATA_EXPORT_ERROR', { filePath, ...context });
    this.name = 'CombatDataExportError';
  }
}

/**
 * Error handler utility for consistent error processing
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{
    timestamp: Date;
    error: Error;
    context?: any;
  }> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with appropriate logging and user messaging
   */
  handle(error: Error, context?: any): void {
    this.logError(error, context);

    if (error instanceof GameError) {
      this.handleGameError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  /**
   * Log error for debugging purposes
   */
  private logError(error: Error, context?: any): void {
    const errorEntry = {
      timestamp: new Date(),
      error,
      context
    };

    this.errorLog.push(errorEntry);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    console.error(`[${error.name}] ${error.message}`, context || '');
  }

  /**
   * Handle game-specific errors with user-friendly messages
   */
  private handleGameError(error: GameError): void {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        console.error(`❌ Validation Error: ${error.message}`);
        if (error.context) {
          console.error(`   Context: ${JSON.stringify(error.context, null, 2)}`);
        }
        break;

      case 'DATA_LOAD_ERROR':
        console.error(`📁 Data Load Error: ${error.message}`);
        if (error instanceof DataLoadError && error.file) {
          console.error(`   File: ${error.file}`);
          console.error(`   💡 Check that the file exists and has valid JSON format`);
        }
        break;

      case 'BATTLE_ERROR':
        console.error(`⚔️ Battle Error: ${error.message}`);
        if (error instanceof BattleError && error.battleId) {
          console.error(`   Battle ID: ${error.battleId}`);
        }
        break;

      case 'CONFIGURATION_ERROR':
        console.error(`⚙️ Configuration Error: ${error.message}`);
        if (error instanceof ConfigurationError && error.option) {
          console.error(`   Option: --${error.option}`);
          console.error(`   💡 Use --help to see available options`);
        }
        break;

      case 'COMBAT_DATA_EXPORT_ERROR':
        console.error(`🎬 Combat Data Export Error: ${error.message}`);
        if (error instanceof CombatDataExportError && error.filePath) {
          console.error(`   File: ${error.filePath}`);
        }
        break;

      default:
        console.error(`❌ Game Error: ${error.message}`);
    }
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: Error): void {
    console.error(`💥 Unexpected Error: ${error.message}`);
    console.error(`   Type: ${error.name}`);
    console.error(`   💡 This might be a bug. Please report it.`);
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): Array<{
    timestamp: Date;
    error: Error;
    context?: any;
  }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: Error): string {
    if (error instanceof GameError) {
      switch (error.code) {
        case 'DATA_LOAD_ERROR':
          return 'There was a problem loading game data. Please check your data files.';
        case 'VALIDATION_ERROR':
          return 'Some game data is invalid. Please check your configuration.';
        case 'BATTLE_ERROR':
          return 'An error occurred during battle. The game will continue.';
        case 'CONFIGURATION_ERROR':
          return 'Invalid configuration. Please check your command line options.';
        case 'COMBAT_DATA_EXPORT_ERROR':
          return 'Failed to export combat data. The game will continue without export.';
        default:
          return 'An unexpected game error occurred.';
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Validation utilities
 */
export class Validator {
  /**
   * Validate that a value is a positive number
   */
  static isPositiveNumber(value: any, fieldName: string): number {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`, { field: fieldName, value });
    }
    return value;
  }

  /**
   * Validate that a value is a non-empty string
   */
  static isNonEmptyString(value: any, fieldName: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new ValidationError(`${fieldName} must be a non-empty string`, { field: fieldName, value });
    }
    return value.trim();
  }

  /**
   * Validate that a value is within a range
   */
  static isInRange(value: number, min: number, max: number, fieldName: string): number {
    if (value < min || value > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}`, {
        field: fieldName,
        value,
        min,
        max
      });
    }
    return value;
  }

  /**
   * Validate that an array is not empty
   */
  static isNonEmptyArray<T>(value: any, fieldName: string): T[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty array`, { field: fieldName, value });
    }
    return value;
  }

  /**
   * Validate file exists
   */
  static async fileExists(filePath: string): Promise<void> {
    try {
      await require('fs').promises.access(filePath);
    } catch {
      throw new DataLoadError(`File does not exist: ${filePath}`, filePath);
    }
  }
}