import { Router } from 'express';
import { z } from 'zod';
import { ShareController } from '../controllers/share.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';

const router = Router();

// Zod validation schemas
const createShareSchema = z.object({
  fileId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  title: z.string().max(120).optional(),
  password: z.string().max(100).optional(),
  expiresAtOption: z.enum(['1h', '1d', '7d', '30d', 'never']).or(z.string()).optional(),
  customExpiresAt: z.string().datetime().optional(),
  allowDownload: z.boolean().optional(),
  maxDownloads: z.number().int().min(1).nullable().optional(),
}).refine((data) => data.fileId || data.folderId, {
  message: 'Either fileId or folderId must be provided.',
});

const uuidParam = z.object({
  id: z.string().uuid(),
});

const tokenParam = z.object({
  token: z.string().min(1),
});

const tokenWithFileParam = z.object({
  token: z.string().min(1),
  fileId: z.string().optional(),
});

// ==========================================
// Public Unauthenticated Endpoints
// ==========================================

// Get public share metadata and preview
router.get('/public/:token', validateParams(tokenParam), ShareController.getPublicShare);

// Verify password for protected link
router.post(
  '/public/:token/unlock',
  validateParams(tokenParam),
  validateBody(z.object({ password: z.string() })),
  ShareController.unlockPublicShare
);

// Stream media for online playback
router.get('/public/:token/stream/:fileId?', validateParams(tokenWithFileParam), ShareController.streamSharedFile);

// Download shared file
router.get('/public/:token/download/:fileId?', validateParams(tokenWithFileParam), ShareController.downloadSharedFile);

// Download all files (album or folder) as ZIP
router.get('/public/:token/download-all', validateParams(tokenParam), ShareController.downloadAllPublic);

// Get QR Code
router.get('/public/:token/qr', validateParams(tokenParam), ShareController.getQrCode);

// ==========================================
// Authenticated Endpoints
// ==========================================

// Create new share link
router.post('/', requireAuth, validateBody(createShareSchema), ShareController.createShareLink);

// List user's share links
router.get('/my-links', requireAuth, ShareController.getUserShareLinks);

// View logs for a specific share link
router.get('/:id/logs', requireAuth, validateParams(uuidParam), ShareController.getShareLinkLogs);

// Revoke share link
router.patch('/:id/revoke', requireAuth, validateParams(uuidParam), ShareController.revokeShareLink);

// Restore revoked share link
router.patch('/:id/restore', requireAuth, validateParams(uuidParam), ShareController.restoreShareLink);

// Delete share link
router.delete('/:id', requireAuth, validateParams(uuidParam), ShareController.deleteShareLink);

export default router;
