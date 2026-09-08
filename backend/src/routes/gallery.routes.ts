import { Router } from 'express';
import { GalleryController } from '../controllers/gallery.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/timeline', GalleryController.getTimeline);
router.get('/duplicates', GalleryController.getDuplicates);
router.get('/exif/:id', GalleryController.getExif);
router.get('/:id/exif', GalleryController.getExif);
router.post('/download-zip', GalleryController.downloadZip);

export default router;
