// Middleware: Request validation utilities
import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Middleware to validate required fields in request body
 */
export function validateRequiredFields(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];
    const body = req.body;

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        errors.push({
          field,
          message: `${field} is required`,
          value: body[field]
        });
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to validate array fields
 */
export function validateArrayField(fieldName: string, minLength: number = 1) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const fieldValue = req.body[fieldName];

    if (!Array.isArray(fieldValue)) {
      res.status(400).json({
        success: false,
        error: `${fieldName} must be an array`
      });
      return;
    }

    if (fieldValue.length < minLength) {
      res.status(400).json({
        success: false,
        error: `${fieldName} must contain at least ${minLength} item(s)`
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to validate string fields
 */
export function validateStringField(fieldName: string, minLength: number = 1, maxLength: number = 100) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const fieldValue = req.body[fieldName];

    if (typeof fieldValue !== 'string') {
      res.status(400).json({
        success: false,
        error: `${fieldName} must be a string`
      });
      return;
    }

    if (fieldValue.length < minLength) {
      res.status(400).json({
        success: false,
        error: `${fieldName} must be at least ${minLength} characters long`
      });
      return;
    }

    if (fieldValue.length > maxLength) {
      res.status(400).json({
        success: false,
        error: `${fieldName} must be no more than ${maxLength} characters long`
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to validate party creation request
 */
export function validatePartyCreation(req: Request, res: Response, next: NextFunction): void {
  const { playerId, name, characters } = req.body;

  // Validate required fields
  if (!playerId || !name || !characters) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: playerId, name, characters'
    });
    return;
  }

  // Validate name
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 50) {
    res.status(400).json({
      success: false,
      error: 'Name must be a string between 1 and 50 characters'
    });
    return;
  }

  // Validate characters array
  if (!Array.isArray(characters) || characters.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Characters must be a non-empty array'
    });
    return;
  }

  // Basic character validation
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    if (!character.id || !character.name || !character.job || !character.stats) {
      res.status(400).json({
        success: false,
        error: `Character at index ${i} is missing required fields (id, name, job, stats)`
      });
      return;
    }
  }

  next();
}

/**
 * Middleware to validate party update request
 */
export function validatePartyUpdate(req: Request, res: Response, next: NextFunction): void {
  const { name, characters } = req.body;

  // At least one field must be provided
  if (name === undefined && characters === undefined) {
    res.status(400).json({
      success: false,
      error: 'At least one field (name or characters) must be provided for update'
    });
    return;
  }

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Name must be a string between 1 and 50 characters'
      });
      return;
    }
  }

  // Validate characters if provided
  if (characters !== undefined) {
    if (!Array.isArray(characters) || characters.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Characters must be a non-empty array'
      });
      return;
    }

    // Basic character validation
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      if (!character.id || !character.name || !character.job || !character.stats) {
        res.status(400).json({
          success: false,
          error: `Character at index ${i} is missing required fields (id, name, job, stats)`
        });
        return;
      }
    }
  }

  next();
}

/**
 * Middleware to validate dungeon creation request
 */
export function validateDungeonCreation(req: Request, res: Response, next: NextFunction): void {
  const { name, description, difficulty, minLevel, battles } = req.body;

  // Validate required fields
  if (!name || !description || !battles) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: name, description, battles'
    });
    return;
  }

  // Validate name
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    res.status(400).json({
      success: false,
      error: 'Name must be a string between 1 and 100 characters'
    });
    return;
  }

  // Validate description
  if (typeof description !== 'string' || description.trim().length === 0 || description.length > 500) {
    res.status(400).json({
      success: false,
      error: 'Description must be a string between 1 and 500 characters'
    });
    return;
  }

  // Validate difficulty
  if (typeof difficulty !== 'number' || difficulty < 1 || difficulty > 10) {
    res.status(400).json({
      success: false,
      error: 'Difficulty must be a number between 1 and 10'
    });
    return;
  }

  // Validate minLevel
  if (typeof minLevel !== 'number' || minLevel < 1) {
    res.status(400).json({
      success: false,
      error: 'Minimum level must be a number greater than or equal to 1'
    });
    return;
  }

  // Validate battles array
  if (!Array.isArray(battles) || battles.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Battles must be a non-empty array'
    });
    return;
  }

  // Validate each battle
  for (let i = 0; i < battles.length; i++) {
    const battle = battles[i];

    if (!battle.enemies || !Array.isArray(battle.enemies) || battle.enemies.length === 0) {
      res.status(400).json({
        success: false,
        error: `Battle at index ${i} must have a non-empty enemies array`
      });
      return;
    }

    if (typeof battle.order !== 'number' || battle.order !== i) {
      res.status(400).json({
        success: false,
        error: `Battle at index ${i} must have order equal to ${i}`
      });
      return;
    }

    // Validate each enemy in the battle
    for (let j = 0; j < battle.enemies.length; j++) {
      const enemy = battle.enemies[j];
      if (!enemy.id || !enemy.name || !enemy.stats) {
        res.status(400).json({
          success: false,
          error: `Enemy at index ${j} in battle ${i} is missing required fields (id, name, stats)`
        });
        return;
      }
    }
  }

  next();
}

/**
 * Middleware to validate dungeon update request
 */
export function validateDungeonUpdate(req: Request, res: Response, next: NextFunction): void {
  const { name, description, difficulty, minLevel, battles } = req.body;

  // At least one field must be provided
  if (name === undefined && description === undefined &&
      difficulty === undefined && minLevel === undefined && battles === undefined) {
    res.status(400).json({
      success: false,
      error: 'At least one field must be provided for update'
    });
    return;
  }

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Name must be a string between 1 and 100 characters'
      });
      return;
    }
  }

  // Validate description if provided
  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length === 0 || description.length > 500) {
      res.status(400).json({
        success: false,
        error: 'Description must be a string between 1 and 500 characters'
      });
      return;
    }
  }

  // Validate difficulty if provided
  if (difficulty !== undefined) {
    if (typeof difficulty !== 'number' || difficulty < 1 || difficulty > 10) {
      res.status(400).json({
        success: false,
        error: 'Difficulty must be a number between 1 and 10'
      });
      return;
    }
  }

  // Validate minLevel if provided
  if (minLevel !== undefined) {
    if (typeof minLevel !== 'number' || minLevel < 1) {
      res.status(400).json({
        success: false,
        error: 'Minimum level must be a number greater than or equal to 1'
      });
      return;
    }
  }

  // Validate battles if provided
  if (battles !== undefined) {
    if (!Array.isArray(battles) || battles.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Battles must be a non-empty array'
      });
      return;
    }

    // Validate each battle
    for (let i = 0; i < battles.length; i++) {
      const battle = battles[i];

      if (!battle.enemies || !Array.isArray(battle.enemies) || battle.enemies.length === 0) {
        res.status(400).json({
          success: false,
          error: `Battle at index ${i} must have a non-empty enemies array`
        });
        return;
      }

      if (typeof battle.order !== 'number' || battle.order !== i) {
        res.status(400).json({
          success: false,
          error: `Battle at index ${i} must have order equal to ${i}`
        });
        return;
      }

      // Validate each enemy in the battle
      for (let j = 0; j < battle.enemies.length; j++) {
        const enemy = battle.enemies[j];
        if (!enemy.id || !enemy.name || !enemy.stats) {
          res.status(400).json({
            success: false,
            error: `Enemy at index ${j} in battle ${i} is missing required fields (id, name, stats)`
          });
          return;
        }
      }
    }
  }

  next();
}

/**
 * Middleware to validate generate combat request
 */
export function validateGenerateCombat(req: Request, res: Response, next: NextFunction): void {
  const { partyId, battleIndex } = req.body;
  const { dungeonId } = req.params;

  // Validate dungeonId from URL params
  if (!dungeonId) {
    res.status(400).json({
      success: false,
      error: 'Dungeon ID is required in URL path'
    });
    return;
  }

  // Validate partyId
  if (!partyId || typeof partyId !== 'string' || partyId.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Party ID is required and must be a non-empty string'
    });
    return;
  }

  // Validate battleIndex if provided
  if (battleIndex !== undefined) {
    const indexNum = parseInt(battleIndex);
    if (isNaN(indexNum) || indexNum < 0) {
      res.status(400).json({
        success: false,
        error: 'Battle index must be a non-negative integer'
      });
      return;
    }
  }

  next();
}

/**
 * General error handling middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}