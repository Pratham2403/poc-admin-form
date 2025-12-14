import express from 'express';
import { createForm, getForms, getFormById, updateForm, deleteForm } from '../controllers/form.controller.ts';
import { authenticate, authorize } from '../middlewares/auth.middleware.ts';
import { UserRole } from '@poc-admin-form/shared';

import { validateSheetAccess } from '../middlewares/sheetValidation.middleware.ts';

const router = express.Router();

router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPERADMIN]), validateSheetAccess, createForm);
router.get('/', authenticate, getForms);
router.get('/:id', authenticate, getFormById);
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPERADMIN]), validateSheetAccess, updateForm);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPERADMIN]), deleteForm);

export default router;
