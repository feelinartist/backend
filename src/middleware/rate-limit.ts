import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisService } from '../infrastructure/services/redis-service';

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

// Helper to create store
const createStore = (prefix: string) => {
    const client = redisService.getClient();
    if (!client) return undefined; // Fallback to memory if Redis is down
    return new RedisStore({
        // @ts-expect-error - ioredis client compatibility
        sendCommand: (...args: string[]) => client.call(...args),
        prefix: `rl:${prefix}:`,
    });
};

// General API rate limiter
export const generalLimiter = rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX_GLOBAL) || 100,
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('general'),
});

// Strict rate limiter for authentication/sensitive endpoints
export const authLimiter = rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX_AUTH) || 5,
    message: 'Demasiados intentos de autenticación, por favor intenta de nuevo en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    store: createStore('auth'),
});

// Moderate rate limiter for file uploads
export const uploadLimiter = rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX_UPLOAD) || 20,
    message: 'Demasiadas cargas de archivos, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('upload'),
});
