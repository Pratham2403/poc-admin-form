import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Generate a CSRF token
 */
export const generateCSRFToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware to attach CSRF token to response
 */
export const attachCSRFToken = (req: Request, res: Response, next: NextFunction) => {
    // Generate CSRF token if not present
    if (!req.cookies.csrf_token) {
        const token = generateCSRFToken();
        res.cookie('csrf_token', token, {
            httpOnly: false, // Must be readable by client JS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        req.csrfToken = token;
    } else {
        req.csrfToken = req.cookies.csrf_token;
    }
    next();
};

/**
 * Middleware to verify CSRF token for state-changing requests
 */
export const verifyCSRFToken = (req: Request, res: Response, next: NextFunction) => {
    const requestMethod = req.method.toUpperCase();

    // Only verify on state-changing methods
    if (!['GET', 'HEAD', 'OPTIONS'].includes(requestMethod)) {
        const cookieToken = req.cookies.csrf_token;
        const headerToken = req.headers['x-csrf-token'];

        if (!cookieToken || !headerToken) {
            return res.status(403).json({
                message: 'CSRF token missing. Please refresh and try again.'
            });
        }

        // Use timing-safe comparison to prevent timing attacks
        if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken as string))) {
            return res.status(403).json({
                message: 'Invalid CSRF token. Please refresh and try again.'
            });
        }
    }

    next();
};

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            csrfToken?: string;
        }
    }
}
