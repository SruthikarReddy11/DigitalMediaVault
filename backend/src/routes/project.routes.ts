import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { ProjectController } from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `pdl-project-img-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max per image
  },
});

// All project showcase endpoints require authentication
router.use(requireAuth);

router.post('/extract', ProjectController.extract);
router.post('/upload-images', upload.array('images', 10), ProjectController.uploadImages);
router.get('/', ProjectController.list);
router.post('/', ProjectController.create);
router.get('/:id', ProjectController.getById);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);
router.post('/:id/favorite', ProjectController.toggleFavorite);

export default router;
