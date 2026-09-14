import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticateToken, requireAuth } from '../middleware/auth';

const router = Router();

// Process prompts (handles both authenticated user queries & guest public inquiries)
router.post('/chat', authenticateToken, AiController.chat);

// Direct image generation
router.post('/generate-image', authenticateToken, AiController.generateImage);

// Save generated image to personal gallery (strictly requires authenticated session)
router.post('/save-generated-image', authenticateToken, requireAuth, AiController.saveGeneratedImage);

export default router;
