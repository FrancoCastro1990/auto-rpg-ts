// Controller: Authentication - User registration, login, and token management
import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '../use-cases/LoginUserUseCase';
import { RefreshTokenUseCase } from '../use-cases/RefreshTokenUseCase';
import { IUserRepository } from '../repositories/interfaces';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password, role } = req.body;

      const result = await this.registerUserUseCase.execute({
        email,
        username,
        password,
        role
      });

      if (result.success && result.user) {
        res.status(201).json({
          success: true,
          data: {
            user: result.user.toPublicJSON()
          },
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error in register controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await this.loginUserUseCase.execute({
        email,
        password
      });

      if (result.success && result.loginResponse) {
        res.status(200).json(result.loginResponse.toJSON());
      } else {
        res.status(401).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error in login controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await this.refreshTokenUseCase.execute({
        refreshToken
      });

      if (result.success && result.tokens) {
        res.status(200).json({
          success: true,
          data: {
            tokens: result.tokens.toJSON()
          },
          message: result.message
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error in refresh token controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh'
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a stateless JWT implementation, logout is handled client-side
      // by removing the token from storage
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Error in logout controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout'
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // This would typically get user info from JWT token in middleware
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // Get user from repository (would be injected)
      // const userRepository = ...;
      // const user = await userRepository.findById(userId);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: userId,
            // user profile data
          }
        },
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      console.error('Error in get profile controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error retrieving profile'
      });
    }
  }
}