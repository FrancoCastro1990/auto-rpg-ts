// Middleware: Advanced error handling and security
import { Request, Response, NextFunction } from 'express';

// Custom error interface
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Custom error classes
export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Enhanced error handler with consistent response format
export const enhancedErrorHandler = (
  err: AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details: any = undefined;

  // Handle different error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
    details = err.details;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    details = err.message;
  } else if (err.name === 'CastError') {
    // Mongoose cast error
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Duplicate entry';
  }

  // Log error with context
  const requestId = req.headers['x-request-id'] || 'unknown';
  const logMessage = `[${requestId}] ${req.method} ${req.url} - Error ${statusCode}: ${message}`;

  if (statusCode >= 500) {
    console.error(`🚨 ${logMessage}`, err.stack);
  } else {
    console.warn(`⚠️  ${logMessage}`);
  }

  // Send consistent error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      code: statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  };

  // Add details in development or for specific error types
  if (process.env.NODE_ENV === 'development' || details || statusCode === 400) {
    if (details) {
      errorResponse.error.details = details;
    }
    if (statusCode >= 500 && err.stack) {
      errorResponse.error.stack = err.stack;
    }
  }

  res.status(statusCode).json(errorResponse);
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = (req.query[key] as string).trim();
    }
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

// Helper function to recursively sanitize objects
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Basic sanitization - remove potentially dangerous characters
      obj[key] = obj[key].trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// Rate limiting store (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }

    // Get or create rate limit data for this key
    let rateLimitData = rateLimitStore.get(key);
    if (!rateLimitData || rateLimitData.resetTime < now) {
      rateLimitData = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, rateLimitData);
    }

    // Check if limit exceeded
    if (rateLimitData.count >= maxRequests) {
      const resetIn = Math.ceil((rateLimitData.resetTime - now) / 1000);

      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests',
          code: 429,
          retryAfter: resetIn,
          limit: maxRequests,
          windowMs
        }
      });
      return;
    }

    // Increment counter
    rateLimitData.count++;

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - rateLimitData.count).toString(),
      'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString()
    });

    next();
  };
};

// Request timeout middleware
export const timeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        const error = new Error(`Request timeout after ${timeoutMs}ms`) as AppError;
        error.statusCode = 408;
        error.isOperational = true;
        next(error);
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  next();
};

// CORS error handler
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err.message && err.message.includes('CORS')) {
    res.status(403).json({
      success: false,
      error: {
        message: 'CORS policy violation',
        code: 403
      }
    });
    return;
  }

  next(err);
};