import rateLimit, { MemoryStore, Store, Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisService } from '../infrastructure/services/redis-service';
import { Request, Response, NextFunction } from 'express';

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const devBypass = (req: Request, res: Response, next: NextFunction) => next();

/**
 * A highly resilient rate limiter store that dynamically shifts between
 * Redis and local MemoryStore depending on actual Redis connectivity.
 * This completely avoids constructor-time Lua script loading crashes when
 * Redis is still connecting during server startup.
 */
class DynamicStore implements Store {
    private localStore = new MemoryStore();
    private redisStore?: RedisStore;
    private options?: Options;
    public prefix?: string;

    constructor(storePrefix: string) {
        this.prefix = `rl:${storePrefix}:`;
    }

    init(options: Options) {
        this.options = options;
        this.localStore.init(options);
    }

    private getStore() {
        const client = redisService.getClient();
        if (client && redisService.getIsConnected()) {
            if (!this.redisStore) {
                try {
                    this.redisStore = new RedisStore({
                        sendCommand: (async (...args: string[]) => {
                            // @ts-expect-error - ioredis call signature compatibility
                            return (await client.call(...args)) as unknown;
                        }) as any,
                        prefix: this.prefix,
                    });
                    if (this.options) {
                        this.redisStore.init(this.options);
                    }
                } catch (error) {
                    console.error(`Error initializing RedisStore for [${this.prefix}]:`, error);
                    return this.localStore;
                }
            }
            return this.redisStore;
        }
        return this.localStore;
    }

    async increment(key: string) {
        return this.getStore().increment(key);
    }

    async decrement(key: string) {
        return this.getStore().decrement(key);
    }

    async resetKey(key: string) {
        return this.getStore().resetKey(key);
    }
}

// General API rate limiter (Bypassed in development mode to prevent lockouts)
export const generalLimiter = isDev ? devBypass : rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX_GLOBAL) || 100,
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new DynamicStore('general'),
});

// Strict rate limiter for authentication/sensitive endpoints (Bypassed in development mode)
export const authLimiter = isDev ? devBypass : rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX_AUTH) || 5,
    message: 'Demasiados intentos de autenticación, por favor intenta de nuevo en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    passOnStoreError: true,
    store: new DynamicStore('auth'),
});

// Moderate rate limiter for file uploads (Bypassed in development mode)
export const uploadLimiter = isDev ? devBypass : rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX_UPLOAD) || 20,
    message: 'Demasiadas cargas de archivos, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new DynamicStore('upload'),
});
