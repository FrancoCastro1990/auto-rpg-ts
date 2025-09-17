// Controller: Party REST API endpoints
import { Request, Response } from 'express';
import { CreatePartyUseCase } from '../use-cases/CreatePartyUseCase';
import { GetPartyUseCase } from '../use-cases/GetPartyUseCase';
import { GetPlayerPartiesUseCase } from '../use-cases/GetPlayerPartiesUseCase';
import { UpdatePartyUseCase } from '../use-cases/UpdatePartyUseCase';
import { DeletePartyUseCase } from '../use-cases/DeletePartyUseCase';
import { IPartyRepository } from '../repositories/interfaces';
import { IPlayerRepository } from '../repositories/interfaces';

export class PartyController {
  constructor(
    private createPartyUseCase: CreatePartyUseCase,
    private getPartyUseCase: GetPartyUseCase,
    private getPlayerPartiesUseCase: GetPlayerPartiesUseCase,
    private updatePartyUseCase: UpdatePartyUseCase,
    private deletePartyUseCase: DeletePartyUseCase
  ) {}

  /**
   * POST /api/parties
   * Create a new party
   */
  async createParty(req: Request, res: Response): Promise<void> {
    try {
      const { playerId, name, characters } = req.body;

      // Basic validation
      if (!playerId || !name || !characters) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: playerId, name, characters'
        });
        return;
      }

      if (!Array.isArray(characters) || characters.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Characters must be a non-empty array'
        });
        return;
      }

      // Execute use case
      const party = await this.createPartyUseCase.execute({
        playerId,
        name,
        characters
      });

      res.status(201).json({
        success: true,
        data: party,
        message: 'Party created successfully'
      });

    } catch (error) {
      console.error('Error creating party:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/parties
   * Get all parties for the authenticated player
   */
  async getPlayerParties(req: Request, res: Response): Promise<void> {
    try {
      const playerId = req.query.playerId as string;

      if (!playerId) {
        res.status(400).json({
          success: false,
          error: 'Player ID is required'
        });
        return;
      }

      const parties = await this.getPlayerPartiesUseCase.execute(playerId);

      res.status(200).json({
        success: true,
        data: parties,
        count: parties.length
      });

    } catch (error) {
      console.error('Error getting player parties:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/parties/:id
   * Get a specific party by ID
   */
  async getParty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Party ID is required'
        });
        return;
      }

      const party = await this.getPartyUseCase.execute(id);

      if (!party) {
        res.status(404).json({
          success: false,
          error: 'Party not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: party
      });

    } catch (error) {
      console.error('Error getting party:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * PUT /api/parties/:id
   * Update a party
   */
  async updateParty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, characters } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Party ID is required'
        });
        return;
      }

      // At least one field must be provided for update
      if (!name && !characters) {
        res.status(400).json({
          success: false,
          error: 'At least one field (name or characters) must be provided for update'
        });
        return;
      }

      const party = await this.updatePartyUseCase.execute(id, {
        name,
        characters
      });

      if (!party) {
        res.status(404).json({
          success: false,
          error: 'Party not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: party,
        message: 'Party updated successfully'
      });

    } catch (error) {
      console.error('Error updating party:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * DELETE /api/parties/:id
   * Delete a party
   */
  async deleteParty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Party ID is required'
        });
        return;
      }

      const success = await this.deletePartyUseCase.execute(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Party not found'
        });
        return;
      }

      res.status(204).send(); // No content

    } catch (error) {
      console.error('Error deleting party:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
}

// Factory function to create PartyController with dependencies
export function createPartyController(
  partyRepository: IPartyRepository,
  playerRepository: IPlayerRepository
): PartyController {
  const createPartyUseCase = new CreatePartyUseCase(partyRepository, playerRepository);
  const getPartyUseCase = new GetPartyUseCase(partyRepository);
  const getPlayerPartiesUseCase = new GetPlayerPartiesUseCase(partyRepository);
  const updatePartyUseCase = new UpdatePartyUseCase(partyRepository, playerRepository);
  const deletePartyUseCase = new DeletePartyUseCase(partyRepository, playerRepository);

  return new PartyController(
    createPartyUseCase,
    getPartyUseCase,
    getPlayerPartiesUseCase,
    updatePartyUseCase,
    deletePartyUseCase
  );
}