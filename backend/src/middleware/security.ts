import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '../config/env';

/**
 * Parse integer safely with validation
 */
export function parseIntSafe(value: any, fieldName: string, min = 1, max = 2147483647): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`Invalid ${fieldName}: must be between ${min} and ${max}`);
  }
  return num;
}

/**
 * Parse float safely with validation
 */
export function parseFloatSafe(value: any, fieldName: string, min = -Infinity, max = Infinity): number {
  const num = parseFloat(value);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`Invalid ${fieldName}: must be between ${min} and ${max}`);
  }
  return num;
}

/**
 * JWT Authentication middleware for REST endpoints
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user'
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authorization middleware - verify user can access resource
 */
export function authorizeUser(req: Request, res: Response, next: NextFunction) {
  try {
    const requestedUserId = parseIntSafe(req.params.id, 'user ID');

    if (req.user?.userId !== requestedUserId) {
      return res.status(403).json({ error: 'Forbidden - you can only access your own data' });
    }

    next();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role?: string;
      };
    }
  }
}
