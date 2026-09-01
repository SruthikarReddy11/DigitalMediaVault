import { Router } from 'express';
import { FavoriteController } from '../controllers/favorite.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', FavoriteController.getFavorites);
router.post('/:fileId', FavoriteController.toggle);

export default router;
