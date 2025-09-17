// Routes: Party API endpoints
import { Router } from 'express';
import { PartyController, createPartyController } from '../controllers/PartyController';
import { validatePartyCreation, validatePartyUpdate } from './validation';
import { IPartyRepository } from '../repositories/interfaces';
import { IPlayerRepository } from '../repositories/interfaces';

export function createPartyRoutes(
  partyRepository: IPartyRepository,
  playerRepository: IPlayerRepository
): Router {
  const router = Router();
  const partyController = createPartyController(partyRepository, playerRepository);

  /**
   * POST /api/parties
   * Create a new party
   */
  router.post('/', validatePartyCreation, (req, res) => partyController.createParty(req, res));

  /**
   * GET /api/parties
   * Get all parties for a player
   * Query params: playerId
   */
  router.get('/', (req, res) => partyController.getPlayerParties(req, res));

  /**
   * GET /api/parties/:id
   * Get a specific party by ID
   */
  router.get('/:id', (req, res) => partyController.getParty(req, res));

  /**
   * PUT /api/parties/:id
   * Update a party
   */
  router.put('/:id', validatePartyUpdate, (req, res) => partyController.updateParty(req, res));

  /**
   * DELETE /api/parties/:id
   * Delete a party
   */
  router.delete('/:id', (req, res) => partyController.deleteParty(req, res));

  return router;
}