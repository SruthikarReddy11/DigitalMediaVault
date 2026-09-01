import { Router } from 'express';
import { FolderController } from '../controllers/folder.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams, uuidParamSchema } from '../middleware/validate';
import { createFolderSchema, updateFolderSchema } from '../validators/folder.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createFolderSchema), FolderController.createFolder);
router.get('/', FolderController.getFolders);
router.get('/tree', FolderController.getFolderTree);
router.patch('/:id', validateParams(uuidParamSchema), validateBody(updateFolderSchema), FolderController.renameFolder);
router.delete('/:id', validateParams(uuidParamSchema), FolderController.deleteFolder);

export default router;
