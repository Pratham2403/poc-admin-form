import express from 'express';
import { submitResponse, getResponses, getMyResponses, updateResponse, getResponseById } from '../controllers/response.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { UserRole } from '@poc-admin-form/shared';

const router = express.Router();

router.post('/', authenticate, submitResponse);
router.put('/:id', authenticate, updateResponse);
// Order matters! /my must come before /:id otherwise 'my' is treated as an id
router.get('/my', authenticate, getMyResponses);
router.get('/:id', authenticate, getResponseById);
router.get('/form/:formId', authenticate, authorize([UserRole.ADMIN, UserRole.SUPERADMIN]), getResponses);

export default router;
