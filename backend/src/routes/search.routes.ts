import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/search?q=...&category=...&limit=...
router.get('/', requireAuth, SearchController.globalSearch);

export default router;
