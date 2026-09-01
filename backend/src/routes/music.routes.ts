import { Router } from 'express';
import { MusicController } from '../controllers/music.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams, uuidParamSchema } from '../middleware/validate';
import { updateMusicMetadataSchema } from '../validators/music.validator';

const router = Router();

router.use(requireAuth);

router.get('/songs', MusicController.getSongs);
router.get('/artists', MusicController.getArtists);
router.get('/albums', MusicController.getAlbums);
router.get('/genres', MusicController.getGenres);
router.get('/songs/:id', validateParams(uuidParamSchema), MusicController.getSong);
router.patch(
  '/songs/:id/metadata',
  validateParams(uuidParamSchema),
  validateBody(updateMusicMetadataSchema),
  MusicController.updateMetadata
);

export default router;
