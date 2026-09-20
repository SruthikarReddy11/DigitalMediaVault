import { Router } from 'express';
import { TripPlanController } from '../controllers/tripPlan.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', TripPlanController.list);
router.post('/', TripPlanController.create);
router.get('/:id', TripPlanController.getById);
router.put('/:id', TripPlanController.update);
router.delete('/:id', TripPlanController.delete);
router.post('/:id/places', TripPlanController.addPlace);
router.delete('/:id/places/:placeId', TripPlanController.removePlace);

export default router;
