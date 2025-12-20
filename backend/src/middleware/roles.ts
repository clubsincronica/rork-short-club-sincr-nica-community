import { Request, Response, NextFunction } from 'express';

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        // User should be attached by authenticateJWT middleware
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = (req.user as any).role || 'user';

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
}

/**
 * Require admin or superuser role
 */
export function requireAdmin() {
    return requireRole('admin', 'superuser');
}

/**
 * Require superuser role only
 */
export function requireSuperUser() {
    return requireRole('superuser');
}

// Extend Express Request type to include role
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
