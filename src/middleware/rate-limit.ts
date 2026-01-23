import rateLimit from 'express-rate-limit';

// General API rate limiter: 100 requests per 15 minutes
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication/sensitive endpoints: 5 requests per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Demasiados intentos de autenticación, por favor intenta de nuevo en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Moderate rate limiter for file uploads: 20 requests per 15 minutes
export const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: 'Demasiadas cargas de archivos, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});
