import express from 'express';
import { getSettings, updateSettings } from '../controllers/systemSettings.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { heartbeat } from '../middlewares/heartbeat.middleware';
import { UserRole } from '@poc-admin-form/shared';

const router = express.Router();

// Routes use: authenticate → heartbeat → authorize([ADMIN, SUPERADMIN])
router.get(
  '/',
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  getSettings
);

router.put(
  '/',
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  updateSettings
);

export default router;

