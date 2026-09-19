import { Router } from 'express';
import { PlaceController } from '../controllers/place.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Photo proxy can be accessed by authenticated users
router.use(requireAuth);

router.post('/resolve', PlaceController.resolve);
router.get('/resolve', PlaceController.resolve);
router.get('/photo', PlaceController.photoProxy);

router.get('/', PlaceController.list);
router.post('/', PlaceController.create);
router.get('/:id', PlaceController.getById);
router.put('/:id', PlaceController.update);
router.delete('/:id', PlaceController.delete);

router.patch('/:id/status', PlaceController.updateStatus);
router.post('/reminders/:reminderId/postpone', PlaceController.postponeReminder);

export default router;
