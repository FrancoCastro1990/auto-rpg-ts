// Use Case: Refresh Token
import { IUserRepository } from '../repositories/interfaces';
import { User, AuthTokens } from '../entities/User';
import { AuthenticationError } from '../middleware/security';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  tokens?: AuthTokens;
  message: string;
}

export class RefreshTokenUseCase {
  constructor(
    private userRepository: IUserRepository,
    private jwtSecret: string,
    private jwtRefreshSecret: string
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      // Validate input
      if (!request.refreshToken) {
        throw new AuthenticationError('Refresh token is required');
      }

      // Verify refresh token
      let decoded: any;
      try {
        decoded = User.verifyToken(request.refreshToken, this.jwtRefreshSecret);
      } catch (error) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Check token type
      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Find user
      const userData = await this.userRepository.findById(decoded.userId);
      if (!userData) {
        throw new AuthenticationError('User not found');
      }

      // Convert to User class instance
      const user = User.fromJSON(userData);

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Generate new tokens
      const accessToken = user.generateAccessToken(this.jwtSecret);
      const refreshToken = user.generateRefreshToken(this.jwtRefreshSecret);

      const tokens = new AuthTokens(
        accessToken,
        refreshToken,
        3600, // 1 hour in seconds
        'Bearer'
      );

      return {
        success: true,
        tokens,
        message: 'Token refreshed successfully'
      };

    } catch (error) {
      console.error('Error refreshing token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        message: errorMessage
      };
    }
  }
}