// Domain Entity: User - Authentication and user management
import { IUser } from './interfaces';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
}

export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin'
}

export class User implements IUser {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastLoginAt: Date | undefined
  ) {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    if (username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public generateAccessToken(secret: string, expiresIn: string | number = '1h'): string {
    const payload: JWTPayload = {
      userId: this.id,
      email: this.email,
      username: this.username,
      role: this.role
    };

    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  public generateRefreshToken(secret: string, expiresIn: string | number = '7d'): string {
    const payload = {
      userId: this.id,
      type: 'refresh'
    };

    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  public static verifyToken(token: string, secret: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  public updateLastLogin(): User {
    return new User(
      this.id,
      this.email,
      this.username,
      this.passwordHash,
      this.role,
      this.isActive,
      this.createdAt,
      this.updatedAt,
      new Date()
    );
  }

  public deactivate(): User {
    return new User(
      this.id,
      this.email,
      this.username,
      this.passwordHash,
      this.role,
      false,
      this.createdAt,
      new Date(),
      this.lastLoginAt
    );
  }

  public changePassword(newPasswordHash: string): User {
    return new User(
      this.id,
      this.email,
      this.username,
      newPasswordHash,
      this.role,
      this.isActive,
      this.createdAt,
      new Date(),
      this.lastLoginAt
    );
  }

  public toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      lastLoginAt: this.lastLoginAt?.toISOString()
    };
  }

  public toPublicJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      createdAt: this.createdAt.toISOString()
    };
  }

  public static fromJSON(data: any): User {
    return new User(
      data.id,
      data.email,
      data.username,
      data.passwordHash,
      data.role || UserRole.PLAYER,
      data.isActive !== undefined ? data.isActive : true,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.lastLoginAt ? new Date(data.lastLoginAt) : undefined
    );
  }
}

// Value object for authentication tokens
export class AuthTokens {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresIn: number,
    public readonly tokenType: string = 'Bearer'
  ) {}

  public toJSON() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresIn: this.expiresIn,
      tokenType: this.tokenType
    };
  }
}

// Value object for login response
export class LoginResponse {
  constructor(
    public readonly user: User,
    public readonly tokens: AuthTokens,
    public readonly message: string = 'Login successful'
  ) {}

  public toJSON() {
    return {
      success: true,
      data: {
        user: this.user.toPublicJSON(),
        tokens: this.tokens.toJSON()
      },
      message: this.message
    };
  }
}