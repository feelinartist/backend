import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                email: string;
                name?: string;
                image?: string;
                sub?: string;
            };
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

        if (!secret) {
            console.error('JWT_SECRET or NEXTAUTH_SECRET not configured');
            return res.status(500).json({ message: 'Error de configuración del servidor' });
        }

        // Verify and decode JWT
        const decoded = jwt.verify(token, secret) as {
            email: string;
            name?: string;
            image?: string;
            sub?: string;
        };

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expirado' });
        }
        return res.status(401).json({ message: 'Error de autenticación' });
    }
};

export const roleGuard = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.email) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            // Here you would typically fetch the user's role from the database
            // For now, we'll pass through and let the controller handle role checks
            // TODO: Implement role fetching from database
            next();
        } catch (error) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
    };
};
