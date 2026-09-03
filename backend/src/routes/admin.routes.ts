import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody, validateQuery, validateParams, uuidParamSchema } from '../middleware/validate';
import { updateUserStatusSchema, adminUserQuerySchema } from '../validators/admin.validator';

const router = Router();

// Protect ALL admin routes with server-side authorization
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/stats', AdminController.getStats);
router.get('/users', validateQuery(adminUserQuerySchema), AdminController.getUsers);
router.patch('/users/:id', validateParams(uuidParamSchema), validateBody(updateUserStatusSchema), AdminController.updateUserStatus);
router.patch('/:id', validateParams(uuidParamSchema), validateBody(updateUserStatusSchema), AdminController.updateUserStatus);
router.delete('/users/:id', validateParams(uuidParamSchema), AdminController.deleteUser);
router.get('/files', AdminController.getAllFiles);
router.post('/verify-pin', AdminController.verifyUserPin);
router.get('/logs', AdminController.getLogs);

export default router;
