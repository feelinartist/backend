import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate request body against a Zod schema
 */
export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    message: 'Error de validación',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};

/**
 * Middleware to validate query parameters against a Zod schema
 */
export const validateQuery = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    message: 'Error de validación en parámetros',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};
