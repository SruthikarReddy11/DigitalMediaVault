import { Router } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/auth.validator';
import { requireAuth } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authRateLimiter = createRateLimiter(15 * 60 * 1000, 30); // 30 attempts per 15 min

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatar upload.'));
    }
  },
});

router.post('/register', authRateLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getMe);
router.get('/session', AuthController.getMe);
router.patch('/profile', requireAuth, validateBody(updateProfileSchema), AuthController.updateProfile);
router.post('/pin/regenerate', requireAuth, AuthController.regeneratePin);

// Active Session Management
router.get('/sessions', requireAuth, AuthController.getSessions);
router.delete('/sessions/other', requireAuth, AuthController.revokeOtherSessions);

// Avatar management routes
router.post('/avatar', requireAuth, upload.single('avatar'), AuthController.uploadAvatar);
router.delete('/avatar', requireAuth, AuthController.removeAvatar);
router.get('/avatar/:userId', AuthController.getAvatar);

export default router;
