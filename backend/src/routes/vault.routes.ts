import { Router } from 'express';
import { VaultController } from '../controllers/vault.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All vault routes require an authenticated user
router.use(requireAuth);

// 2FA Google Authenticator Endpoints
router.get('/2fa/status', VaultController.get2FAStatus);
router.post('/2fa/setup', VaultController.setup2FA);
router.post('/2fa/verify', VaultController.verify2FA);
router.post('/2fa/disable', VaultController.disable2FA);

// Password-Protected Folders Endpoints
router.get('/folders', VaultController.listFolders);
router.post('/folders', VaultController.createFolder);
router.post('/folders/:id/unlock', VaultController.unlockFolder);
router.patch('/folders/:id', VaultController.updateFolder);
router.delete('/folders/:id', VaultController.deleteFolder);

// Link Cells Endpoints
router.post('/folders/:folderId/cells', VaultController.createCell);
router.patch('/cells/:id', VaultController.updateCell);
router.delete('/cells/:id', VaultController.deleteCell);

export default router;
