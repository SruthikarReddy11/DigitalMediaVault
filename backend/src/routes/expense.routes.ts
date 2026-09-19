import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { BankSyncController } from '../controllers/bankSync.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All expense routes require authentication
router.use(requireAuth);

// Account Aggregator (AA) Bank Sync Routes
router.get('/bank/supported-banks', BankSyncController.getSupportedBanks);
router.post('/bank/consent/initiate', BankSyncController.initiateConsent);
router.post('/bank/consent/verify', BankSyncController.verifyConsent);
router.post('/bank/sync', BankSyncController.syncTransactions);
router.get('/bank/accounts', BankSyncController.getConnectedAccounts);
router.delete('/bank/accounts/:id', BankSyncController.disconnectAccount);

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
