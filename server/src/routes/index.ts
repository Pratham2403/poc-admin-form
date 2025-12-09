import express from 'express';
import authRoutes from './auth.routes.js';
import formRoutes from './form.routes.js';
import responseRoutes from './response.routes.js';


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/forms', formRoutes);
router.use('/responses', responseRoutes);


export default router;
