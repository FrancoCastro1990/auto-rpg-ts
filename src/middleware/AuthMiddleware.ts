// Middleware: JWT Authentication - Token verification and user extraction
import { Request, Response, NextFunction } from 'express';
import { User } from '../entities/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
    role: string;
  };
}

export class AuthMiddleware {
  constructor(
    private jwtSecret: string
  ) {}

  authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const decoded = User.verifyToken(token, this.jwtSecret);

      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };

  authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = User.verifyToken(token, this.jwtSecret);

        (req as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role
        };
      }

      next();
    } catch (error) {
      // Ignore auth errors for optional auth
      next();
    }
  };
}