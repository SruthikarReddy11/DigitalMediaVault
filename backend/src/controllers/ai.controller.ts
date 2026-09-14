import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AiService } from '../services/ai.service';

export class AiController {
  /**
   * Process a conversational or database retrieval prompt
   */
  public static async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { prompt } = req.body;
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

      const result = await AiService.processPrompt(prompt, req.user);
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

  /**
   * Direct image generation endpoint
   */
  public static async generateImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Image prompt is required.',
          },
        });
        return;
      }

      const result = await AiService.generateImage(prompt);
      res.json({
        success: true,
        imageUrl: result.imageUrl,
        prompt: result.prompt,
      });
    } catch (err: any) {
      console.error('AiController.generateImage error:', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'IMAGE_GENERATION_ERROR',
          message: err.message || 'Failed to generate image.',
        },
      });
    }
  }

  /**
   * Save an AI-generated image directly into the user's gallery/vault
   */
  public static async saveGeneratedImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to save images to your library.',
          },
        });
        return;
      }

      const { imageUrl, prompt } = req.body;
      if (!imageUrl || typeof imageUrl !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Image URL is required.',
          },
        });
        return;
      }

      const file = await AiService.saveGeneratedImage(req.user, imageUrl, prompt);
      res.json({
        success: true,
        message: 'Image successfully saved to your Gallery.',
        file,
      });
    } catch (err: any) {
      console.error('AiController.saveGeneratedImage error:', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'SAVE_IMAGE_ERROR',
          message: err.message || 'Failed to save generated image to library.',
        },
      });
    }
  }
}
