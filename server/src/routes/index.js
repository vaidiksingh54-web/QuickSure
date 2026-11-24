import { Router } from 'express'
import healthRoutes from './healthRoutes.js'
import authRoutes from './authRoutes.js'
import categoryRoutes from './categoryRoutes.js'
import productRoutes from './productRoutes.js'
import uploadRoutes from './uploadRoutes.js'
import cartRoutes from './cartRoutes.js'
import wishlistRoutes from './wishlistRoutes.js'
import orderRoutes from './orderRoutes.js'
import adminRoutes from './adminRoutes.js'
import sellerRoutes from './sellerRoutes.js'

/**
 * QuickSure Central API Router
 * Aggregates all route modules for /api prefix
 */
const apiRouter = Router()

apiRouter.use('/health', healthRoutes)
apiRouter.use('/auth', authRoutes)
apiRouter.use('/categories', categoryRoutes)
apiRouter.use('/products', productRoutes)
apiRouter.use('/upload', uploadRoutes)
apiRouter.use('/cart', cartRoutes)
apiRouter.use('/wishlist', wishlistRoutes)
apiRouter.use('/orders', orderRoutes)
apiRouter.use('/admin', adminRoutes)
apiRouter.use('/seller', sellerRoutes)

export default apiRouter
