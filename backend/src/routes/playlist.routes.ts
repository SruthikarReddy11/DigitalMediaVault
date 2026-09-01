import { Router } from 'express';
import { PlaylistController } from '../controllers/playlist.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams, uuidParamSchema } from '../middleware/validate';
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addSongToPlaylistSchema,
  reorderPlaylistSchema,
} from '../validators/playlist.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createPlaylistSchema), PlaylistController.createPlaylist);
router.get('/', PlaylistController.getPlaylists);
router.get('/:id', validateParams(uuidParamSchema), PlaylistController.getPlaylist);
router.patch('/:id', validateParams(uuidParamSchema), validateBody(updatePlaylistSchema), PlaylistController.updatePlaylist);
router.delete('/:id', validateParams(uuidParamSchema), PlaylistController.deletePlaylist);
router.post('/:id/songs', validateParams(uuidParamSchema), validateBody(addSongToPlaylistSchema), PlaylistController.addSong);
router.delete('/:id/songs/:musicId', validateParams(uuidParamSchema), PlaylistController.removeSong);
router.put('/:id/reorder', validateParams(uuidParamSchema), validateBody(reorderPlaylistSchema), PlaylistController.reorder);

export default router;
