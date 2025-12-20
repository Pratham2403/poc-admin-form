import express from 'express';
import { createForm, getForms, getFormById, updateForm, deleteForm, getFormStats } from '../controllers/form.controller.ts';
import { authenticate, authorize, authorizeModule } from '../middlewares/auth.middleware.ts';
import { heartbeat } from '../middlewares/heartbeat.middleware.ts';
import { UserRole } from '@poc-admin-form/shared';

import { validateSheetAccess } from '../middlewares/sheetValidation.middleware.ts';

const router = express.Router();

// Form management routes use: authenticate → heartbeat → authorize([ADMIN, SUPERADMIN]) → authorizeModule('forms')
router.post('/', authenticate, heartbeat, authorize([UserRole.ADMIN, UserRole.SUPERADMIN]), authorizeModule('forms'), validateSheetAccess, createForm);
router.get('/', authenticate, heartbeat, getForms);

// Stats route MUST come before /:id to avoid matching 'stats' as an id
router.get('/stats', authenticate, heartbeat, authorize([UserRole.ADMIN, UserRole.SUPERADMIN]), getFormStats);

router.get('/:id', authenticate, heartbeat, getFormById);
router.put('/:id', authenticate, heartbeat, authorize([UserRole.ADMIN, UserRole.SUPERADMIN]), authorizeModule('forms'), validateSheetAccess, updateForm);
router.delete('/:id', authenticate, heartbeat, authorize([UserRole.ADMIN, UserRole.SUPERADMIN]), authorizeModule('forms'), deleteForm);

export default router;
