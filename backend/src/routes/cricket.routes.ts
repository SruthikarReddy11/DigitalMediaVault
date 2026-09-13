import { Router } from 'express';
import { CricketController } from '../controllers/cricket.controller';

const router = Router();

// Public endpoint for live cricket scores
router.get('/live-scores', CricketController.getLiveScores);

export default router;
