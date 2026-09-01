import { Router } from 'express';
import authRoutes from './auth.routes';
import fileRoutes from './file.routes';
import folderRoutes from './folder.routes';
import musicRoutes from './music.routes';
import playlistRoutes from './playlist.routes';
import favoriteRoutes from './favorite.routes';
import trashRoutes from './trash.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/folders', folderRoutes);
router.use('/music', musicRoutes);
router.use('/playlists', playlistRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/trash', trashRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
