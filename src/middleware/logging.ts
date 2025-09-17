// Middleware: Request logging and monitoring
import { Request, Response, NextFunction } from 'express';
import { BattleLogger } from '../utils/BattleLogger';

/**
 * Middleware to log HTTP requests
 */
export function requestLogger(logger?: BattleLogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    // Log request
    const logMessage = `[${timestamp}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`;
    console.log(`📨 ${logMessage}`);

    if (logger) {
      logger.logDebug('HTTP', `Request: ${method} ${url}`);
    }

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const statusMessage = res.statusMessage || 'Unknown';

      const responseLog = `[${new Date().toISOString()}] ${method} ${url} - ${statusCode} ${statusMessage} - ${duration}ms`;
      console.log(`📤 ${responseLog}`);

      if (logger) {
        logger.logDebug('HTTP', `Response: ${statusCode} ${statusMessage} - ${duration}ms`);
      }
    });

    next();
  };
}

/**
 * Middleware to log API requests with more details
 */
export function apiLogger(logger?: BattleLogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    // Only log API requests
    if (!req.url.startsWith('/api/')) {
      return next();
    }

    const method = req.method;
    const url = req.url;
    const body = req.body ? JSON.stringify(req.body).substring(0, 200) + '...' : 'No body';
    const query = req.query ? JSON.stringify(req.query) : 'No query';

    const requestDetails = {
      method,
      url,
      query,
      body,
      headers: {
        'content-type': req.get('Content-Type'),
        'user-agent': req.get('User-Agent'),
        'authorization': req.get('Authorization') ? '[PRESENT]' : '[NOT PRESENT]'
      },
      timestamp: new Date().toISOString()
    };

    console.log(`🔍 API Request:`, JSON.stringify(requestDetails, null, 2));

    if (logger) {
      logger.logDebug('API_REQUEST', `${method} ${url} - Body: ${body}`);
    }

    // Log response details
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;

      console.log(`✅ API Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`);

      if (logger) {
        logger.logDebug('API_RESPONSE', `${statusCode} - ${duration}ms`);
      }
    });

    next();
  };
}

/**
 * Middleware to add request ID for tracking
 */
export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  };
}

/**
 * Middleware to log errors with context
 */
export function errorLogger(logger?: BattleLogger) {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const method = req.method;
    const url = req.url;
    const errorDetails = {
      requestId,
      method,
      url,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    console.error(`❌ Error [${requestId}]:`, JSON.stringify(errorDetails, null, 2));

    if (logger) {
      logger.logError('HTTP_ERROR', `${method} ${url} - ${err.message}`);
    }

    next(err);
  };
}