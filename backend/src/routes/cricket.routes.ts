import { Router } from 'express';
import { CricketController } from '../controllers/cricket.controller';

const router = Router();

// Public endpoints for cricket
router.get('/matches', CricketController.getMatches);
router.get('/live-scores', CricketController.getLiveScores);
router.get('/scorecard', CricketController.getMatchScorecard);

export default router;
