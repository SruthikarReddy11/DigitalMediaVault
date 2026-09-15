import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Process prompts (handles authenticated user queries & guest public inquiries)
router.post('/chat', authenticateToken, AiController.chat);

export default router;
