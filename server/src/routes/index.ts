import express from 'express';
import authRoutes from './auth.routes.ts';
import formRoutes from './form.routes.ts';
import responseRoutes from './response.routes.ts';
import userRoutes from './user.routes.ts';
import systemSettingsRoutes from './systemSettings.routes.ts';


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/forms', formRoutes);
router.use('/responses', responseRoutes);
router.use('/users', userRoutes);
router.use('/system-settings', systemSettingsRoutes);


export default router;
