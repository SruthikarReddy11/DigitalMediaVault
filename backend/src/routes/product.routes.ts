import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { ProductSectionController } from '../controllers/productSection.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All product vault endpoints require an authenticated user
router.use(requireAuth);

// Extract metadata from any e-commerce product URL
router.post('/extract', ProductController.extract);

// Product Sections CRUD & Operations
router.get('/sections', ProductSectionController.list);
router.post('/sections', ProductSectionController.create);
router.get('/sections/:id', ProductSectionController.getById);
router.put('/sections/:id', ProductSectionController.update);
router.delete('/sections/:id', ProductSectionController.delete);
router.post('/sections/:id/unlock', ProductSectionController.verifyPassword);
router.post('/sections/:id/products', ProductSectionController.addProducts);
router.delete('/sections/:id/products/:productId', ProductSectionController.removeProduct);
router.get('/product-sections/:productId', ProductSectionController.getProductSections);

// Product CRUD
router.get('/', ProductController.list);
router.post('/', ProductController.create);
router.get('/:id', ProductController.getById);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

// Quick actions
router.get('/:id/share', ProductController.getShareData);
router.post('/:id/favorite', ProductController.toggleFavorite);
router.post('/:id/purchased', ProductController.togglePurchased);
router.post('/:id/refresh', ProductController.refreshPrice);

export default router;
