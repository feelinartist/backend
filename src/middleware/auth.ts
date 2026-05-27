import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                rol?: string;
                name?: string;
                image?: string;
            };
        }
    }
}

function getSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET or NEXTAUTH_SECRET not configured');
    }
    return secret;
}

/**
 * Generates a signed JWT for a user.
 */
export function generateToken(payload: { id: string; email: string; rol?: string }): string {
    return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

/**
 * Middleware that verifies a JWT Bearer token and attaches user info to req.user.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, getSecret()) as {
            id: string;
            email: string;
            rol?: string;
            name?: string;
            image?: string;
        };

        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

/**
 * Middleware that checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER authMiddleware.
 */
export const roleGuard = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        if (!req.user.rol || !allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ message: 'No tienes permisos para esta acción' });
        }

        next();
    };
};
