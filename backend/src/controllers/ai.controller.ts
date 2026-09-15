import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AiService } from '../services/ai.service';

export class AiController {
  /**
   * Process a conversational or database retrieval prompt using Gemini AI
   */
  public static async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { prompt, history } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Prompt is required.',
          },
        });
        return;
      }

      const conversationHistory = Array.isArray(history)
        ? history.filter((h: any) => h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'model'))
        : undefined;

      const result = await AiService.processPrompt(prompt, req.user, conversationHistory);
      res.json({
        success: true,
        action: result.action,
        reply: result.reply,
        data: result.data,
      });
    } catch (err: any) {
      console.error('AiController.chat error:', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_PROCESSING_ERROR',
          message: err.message || 'Failed to process AI prompt.',
        },
      });
    }
  }
}
