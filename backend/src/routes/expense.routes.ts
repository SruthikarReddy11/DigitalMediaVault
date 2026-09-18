import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All expense routes require authentication
router.use(requireAuth);

// Analytics & Insights
router.get('/analytics', ExpenseController.analytics);

// Clear sample/test data
router.post('/clear-sample', ExpenseController.clearSample);

// CSV Export
router.get('/export', ExpenseController.exportCsv);

// Standard CRUD
router.get('/', ExpenseController.list);
router.post('/', ExpenseController.create);
router.get('/:id', ExpenseController.getById);
router.put('/:id', ExpenseController.update);
router.delete('/:id', ExpenseController.delete);

export default router;
