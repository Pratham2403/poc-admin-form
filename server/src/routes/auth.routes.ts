import express from 'express';
import { register, login, logout, refresh, getCSRFToken } from '../controllers/auth.controller.ts';
import { authenticate, authorize } from "../middlewares/auth.middleware.ts"
import { authRateLimiter } from '../middlewares/ratelimit.middleware.ts';
import { UserRole } from '@poc-admin-form/shared';

const router = express.Router();

router.get('/csrf-token', getCSRFToken);
router.post('/register', authenticate, authorize([UserRole.SUPERADMIN]), register);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);
router.post('/refresh', authRateLimiter, refresh);

export default router;
