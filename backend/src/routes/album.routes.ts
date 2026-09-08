import { Router } from 'express';
import { AlbumController } from '../controllers/album.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', AlbumController.createAlbum);
router.get('/', AlbumController.getAlbums);
router.get('/:id', AlbumController.getAlbum);
router.patch('/:id', AlbumController.updateAlbum);
router.delete('/:id', AlbumController.deleteAlbum);

router.post('/:id/photos', AlbumController.addPhotos);
router.delete('/:id/photos/:fileId', AlbumController.removePhoto);
router.post('/:id/share', AlbumController.shareAlbum);

export default router;
