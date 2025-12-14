import express from 'express';
import authRoutes from './auth.routes.ts';
import formRoutes from './form.routes.ts';
import responseRoutes from './response.routes.ts';


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/forms', formRoutes);
router.use('/responses', responseRoutes);


export default router;
