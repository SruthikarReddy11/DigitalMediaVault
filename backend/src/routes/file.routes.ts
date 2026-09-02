import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { FileController } from '../controllers/file.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams, uuidParamSchema } from '../middleware/validate';
import { renameFileSchema, moveFileSchema, fileQuerySchema } from '../validators/file.validator';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { config } from '../config';

const router = Router();

// Stream uploads directly to temporary disk files to avoid Node.js RAM memory bloat / OOM crashes
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `pdl-upload-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: config.storage.maxFileSizeBytes,
  },
});

router.use(requireAuth);

router.get('/dashboard', FileController.getDashboardStats);
router.post('/upload', uploadRateLimiter, upload.array('files', 20), FileController.uploadFiles);
router.get('/', validateQuery(fileQuerySchema), FileController.listFiles);
router.get('/:id', validateParams(uuidParamSchema), FileController.getFile);
router.get('/:id/stream', validateParams(uuidParamSchema), FileController.streamFile);
router.get('/:id/download', validateParams(uuidParamSchema), FileController.downloadFile);
router.patch('/:id/rename', validateParams(uuidParamSchema), validateBody(renameFileSchema), FileController.renameFile);
router.patch('/:id/move', validateParams(uuidParamSchema), validateBody(moveFileSchema), FileController.moveFile);
router.delete('/:id/trash', validateParams(uuidParamSchema), FileController.moveToTrash);
router.post('/:id/restore', validateParams(uuidParamSchema), FileController.restoreFromTrash);
router.delete('/:id/permanent', validateParams(uuidParamSchema), FileController.permanentDelete);

export default router;
