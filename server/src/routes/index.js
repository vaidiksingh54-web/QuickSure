import { Router } from 'express';
import healthRoutes from './healthRoutes.js';

const apiRouter = Router();

// Sub-routers will be mounted here in subsequent stages:
// apiRouter.use('/auth', authRoutes);
// apiRouter.use('/products', productRoutes);
// apiRouter.use('/cart', cartRoutes);
// apiRouter.use('/orders', orderRoutes);

apiRouter.use('/health', healthRoutes);

export default apiRouter;
