import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All product vault endpoints require an authenticated user
router.use(requireAuth);

// Extract metadata from any e-commerce product URL
router.post('/extract', ProductController.extract);

// Product CRUD
router.get('/', ProductController.list);
router.post('/', ProductController.create);
router.get('/:id', ProductController.getById);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

// Quick actions
router.post('/:id/favorite', ProductController.toggleFavorite);
router.post('/:id/purchased', ProductController.togglePurchased);
router.post('/:id/refresh', ProductController.refreshPrice);

export default router;
