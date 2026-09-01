import { Router } from 'express';
import { TrashController } from '../controllers/trash.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', TrashController.getTrash);
router.post('/restore-all', TrashController.restoreAll);
router.delete('/empty', TrashController.emptyTrash);

export default router;
