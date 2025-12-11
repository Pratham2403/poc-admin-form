import rateLimit from 'express-rate-limit';

// Get environment
const env = process.env.NODE_ENV || 'development';

/**
 * Rate limiter for authentication endpoints (login, refresh)
 * Stricter limits to prevent brute-force attacks
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: env === 'production' ? 20 : 100, // 20 attempts per 15 min window (skipSuccessfulRequests handles valid users)
    skipSuccessfulRequests: true, // Don't count successful logins against the rate limit
    message: {
        message: 'Too many login attempts from this IP, please try again after 15 minutes',
        success: false
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // trustProxy is handled by app.set('trust proxy', 1) in server.ts
});

/**
 * General rate limiter for strict API endpoints or global usage if needed
 */
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: env === 'production' ? 100 : 1000,
    message: {
        message: 'Too many requests from this IP, please try again later',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});