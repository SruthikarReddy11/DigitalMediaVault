import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All contacts endpoints require an authenticated user
router.use(requireAuth);

// Unlock contacts vault with password
router.post('/unlock', ContactController.unlock);

// Contacts management
router.get('/', ContactController.list);
router.post('/', ContactController.create);
router.put('/:id', ContactController.update);
router.delete('/:id', ContactController.delete);
router.post('/:id/favorite', ContactController.toggleFavorite);

export default router;
