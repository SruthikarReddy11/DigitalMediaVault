import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { VaultController } from '../controllers/vault.controller';
import { requireAuth } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { config } from '../config';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `vault-upload-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: config.storage.maxFileSizeBytes,
  },
});

// All vault routes require an authenticated user
router.use(requireAuth);

// 2FA Google Authenticator Endpoints
router.get('/2fa/status', VaultController.get2FAStatus);
router.post('/2fa/setup', VaultController.setup2FA);
router.post('/2fa/verify', VaultController.verify2FA);
router.post('/2fa/disable', VaultController.disable2FA);
router.post('/lock', VaultController.lockVault);

// Password-Protected Folders Endpoints
router.get('/folders', VaultController.listFolders);
router.post('/folders', VaultController.createFolder);
router.post('/folders/:id/unlock', VaultController.unlockFolder);
router.patch('/folders/:id', VaultController.updateFolder);
router.delete('/folders/:id', VaultController.deleteFolder);

// Private Files & Media in Vault Folders
router.post('/folders/:id/files', uploadRateLimiter, upload.array('files', 20), VaultController.uploadFolderFiles);
router.get('/folders/:id/files', VaultController.getFolderFiles);
router.delete('/files/:fileId', VaultController.deleteFile);

// Link Cells Endpoints
router.post('/folders/:folderId/cells', VaultController.createCell);
router.patch('/cells/:id', VaultController.updateCell);
router.delete('/cells/:id', VaultController.deleteCell);

// URL Video Preview Detection Endpoint
router.get('/preview', VaultController.detectVideo);

export default router;
