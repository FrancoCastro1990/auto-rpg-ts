// Use Case: Login User
import { IUserRepository } from '../repositories/interfaces';
import { User, LoginResponse, AuthTokens } from '../entities/User';
import { ValidationError, AuthenticationError } from '../middleware/security';

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  success: boolean;
  loginResponse?: LoginResponse;
  message: string;
}

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private jwtSecret: string,
    private jwtRefreshSecret: string
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    try {
      // Validate input
      if (!request.email || !request.password) {
        throw new ValidationError('Email and password are required');
      }

      // Find user by email
      const userData = await this.userRepository.findByEmail(request.email);
      if (!userData) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Convert to User class instance
      const user = User.fromJSON(userData);

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(request.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      const updatedUser = user.updateLastLogin();
      await this.userRepository.updateLastLogin(updatedUser.id);

      // Generate tokens
      const accessToken = updatedUser.generateAccessToken(this.jwtSecret);
      const refreshToken = updatedUser.generateRefreshToken(this.jwtRefreshSecret);

      const tokens = new AuthTokens(
        accessToken,
        refreshToken,
        3600, // 1 hour in seconds
        'Bearer'
      );

      const loginResponse = new LoginResponse(
        updatedUser,
        tokens,
        'Login successful'
      );

      return {
        success: true,
        loginResponse,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Error logging in user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        message: errorMessage
      };
    }
  }
}