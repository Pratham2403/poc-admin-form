import express from 'express';
import { submitResponse, getResponses, getMyResponses, updateResponse } from '../controllers/response.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { UserRole } from '@poc-admin-form/shared';

const router = express.Router();

router.post('/', authenticate, submitResponse);
router.put('/:id', authenticate, updateResponse);
router.get('/my', authenticate, getMyResponses);
router.get('/form/:formId', authenticate, authorize([UserRole.ADMIN]), getResponses);

export default router;
