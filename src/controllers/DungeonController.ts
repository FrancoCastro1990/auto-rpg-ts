// Controller: Dungeon REST API endpoints
import { Request, Response } from 'express';
import { CreateDungeonUseCase } from '../use-cases/CreateDungeonUseCase';
import { GetDungeonUseCase } from '../use-cases/GetDungeonUseCase';
import { GetDungeonsUseCase } from '../use-cases/GetDungeonsUseCase';
import { UpdateDungeonUseCase } from '../use-cases/UpdateDungeonUseCase';
import { DeleteDungeonUseCase } from '../use-cases/DeleteDungeonUseCase';
import { IDungeonRepository } from '../repositories/interfaces';

export class DungeonController {
  constructor(
    private createDungeonUseCase: CreateDungeonUseCase,
    private getDungeonUseCase: GetDungeonUseCase,
    private getDungeonsUseCase: GetDungeonsUseCase,
    private updateDungeonUseCase: UpdateDungeonUseCase,
    private deleteDungeonUseCase: DeleteDungeonUseCase
  ) {}

  /**
   * POST /api/dungeons
   * Create a new dungeon
   */
  async createDungeon(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, difficulty, minLevel, battles } = req.body;

      // Basic validation
      if (!name || !description || !battles) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, description, battles'
        });
        return;
      }

      if (!Array.isArray(battles) || battles.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Battles must be a non-empty array'
        });
        return;
      }

      if (difficulty < 1 || difficulty > 10) {
        res.status(400).json({
          success: false,
          error: 'Difficulty must be between 1 and 10'
        });
        return;
      }

      if (minLevel < 1) {
        res.status(400).json({
          success: false,
          error: 'Minimum level must be at least 1'
        });
        return;
      }

      // Execute use case
      const dungeon = await this.createDungeonUseCase.execute({
        name,
        description,
        difficulty,
        minLevel,
        battles
      });

      res.status(201).json({
        success: true,
        data: dungeon,
        message: 'Dungeon created successfully'
      });

    } catch (error) {
      console.error('Error creating dungeon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/dungeons
   * Get all dungeons with optional filters
   */
  async getDungeons(req: Request, res: Response): Promise<void> {
    try {
      const { difficulty, minLevel } = req.query;

      const filters: { difficulty?: number; minLevel?: number } = {};

      if (difficulty) {
        const diffNum = parseInt(difficulty as string);
        if (!isNaN(diffNum) && diffNum >= 1 && diffNum <= 10) {
          filters.difficulty = diffNum;
        }
      }

      if (minLevel) {
        const levelNum = parseInt(minLevel as string);
        if (!isNaN(levelNum) && levelNum >= 1) {
          filters.minLevel = levelNum;
        }
      }

      const dungeons = await this.getDungeonsUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: dungeons,
        count: dungeons.length,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      });

    } catch (error) {
      console.error('Error getting dungeons:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/dungeons/:id
   * Get a specific dungeon by ID
   */
  async getDungeon(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Dungeon ID is required'
        });
        return;
      }

      const dungeon = await this.getDungeonUseCase.execute(id);

      if (!dungeon) {
        res.status(404).json({
          success: false,
          error: 'Dungeon not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dungeon
      });

    } catch (error) {
      console.error('Error getting dungeon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * PUT /api/dungeons/:id
   * Update a dungeon
   */
  async updateDungeon(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, difficulty, minLevel, battles } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Dungeon ID is required'
        });
        return;
      }

      // At least one field must be provided for update
      if (!name && !description && difficulty === undefined && minLevel === undefined && !battles) {
        res.status(400).json({
          success: false,
          error: 'At least one field must be provided for update'
        });
        return;
      }

      // Validate difficulty if provided
      if (difficulty !== undefined && (difficulty < 1 || difficulty > 10)) {
        res.status(400).json({
          success: false,
          error: 'Difficulty must be between 1 and 10'
        });
        return;
      }

      // Validate minLevel if provided
      if (minLevel !== undefined && minLevel < 1) {
        res.status(400).json({
          success: false,
          error: 'Minimum level must be at least 1'
        });
        return;
      }

      const dungeon = await this.updateDungeonUseCase.execute(id, {
        name,
        description,
        difficulty,
        minLevel,
        battles
      });

      if (!dungeon) {
        res.status(404).json({
          success: false,
          error: 'Dungeon not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dungeon,
        message: 'Dungeon updated successfully'
      });

    } catch (error) {
      console.error('Error updating dungeon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * DELETE /api/dungeons/:id
   * Delete a dungeon
   */
  async deleteDungeon(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Dungeon ID is required'
        });
        return;
      }

      const success = await this.deleteDungeonUseCase.execute(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Dungeon not found'
        });
        return;
      }

      res.status(204).send(); // No content

    } catch (error) {
      console.error('Error deleting dungeon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
}

// Factory function to create DungeonController with dependencies
export function createDungeonController(
  dungeonRepository: IDungeonRepository
): DungeonController {
  const createDungeonUseCase = new CreateDungeonUseCase(dungeonRepository);
  const getDungeonUseCase = new GetDungeonUseCase(dungeonRepository);
  const getDungeonsUseCase = new GetDungeonsUseCase(dungeonRepository);
  const updateDungeonUseCase = new UpdateDungeonUseCase(dungeonRepository);
  const deleteDungeonUseCase = new DeleteDungeonUseCase(dungeonRepository);

  return new DungeonController(
    createDungeonUseCase,
    getDungeonUseCase,
    getDungeonsUseCase,
    updateDungeonUseCase,
    deleteDungeonUseCase
  );
}