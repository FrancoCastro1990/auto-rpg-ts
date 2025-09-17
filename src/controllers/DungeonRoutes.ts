// Routes: Dungeon API endpoints
import { Router } from 'express';
import { DungeonController, createDungeonController } from '../controllers/DungeonController';
import { validateDungeonCreation, validateDungeonUpdate } from './validation';
import { IDungeonRepository } from '../repositories/interfaces';

export function createDungeonRoutes(
  dungeonRepository: IDungeonRepository
): Router {
  const router = Router();
  const dungeonController = createDungeonController(dungeonRepository);

  /**
   * POST /api/dungeons
   * Create a new dungeon
   */
  router.post('/', validateDungeonCreation, (req, res) => dungeonController.createDungeon(req, res));

  /**
   * GET /api/dungeons
   * Get all dungeons with optional filters
   * Query params: difficulty, minLevel
   */
  router.get('/', (req, res) => dungeonController.getDungeons(req, res));

  /**
   * GET /api/dungeons/:id
   * Get a specific dungeon by ID
   */
  router.get('/:id', (req, res) => dungeonController.getDungeon(req, res));

  /**
   * PUT /api/dungeons/:id
   * Update a dungeon
   */
  router.put('/:id', validateDungeonUpdate, (req, res) => dungeonController.updateDungeon(req, res));

  /**
   * DELETE /api/dungeons/:id
   * Delete a dungeon
   */
  router.delete('/:id', (req, res) => dungeonController.deleteDungeon(req, res));

  return router;
}