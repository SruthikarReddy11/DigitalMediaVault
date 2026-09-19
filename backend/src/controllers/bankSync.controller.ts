import { Request, Response } from 'express';
import { AccountAggregatorService } from '../services/accountAggregator.service';

export class BankSyncController {
  /**
   * GET /api/expenses/bank/supported-banks
   */
  public static async getSupportedBanks(_req: Request, res: Response): Promise<void> {
    try {
      const banks = AccountAggregatorService.getSupportedBanks();
      res.json({
        success: true,
        data: banks,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch banks' });
    }
  }

  /**
   * POST /api/expenses/bank/consent/initiate
   */
  public static async initiateConsent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { mobileNumber, fipId } = req.body;
      if (!mobileNumber || !fipId) {
        res.status(400).json({ success: false, message: 'Mobile number and bank (FIP) are required' });
        return;
      }

      const result = await AccountAggregatorService.initiateConsent(userId, mobileNumber, fipId);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to initiate consent' });
    }
  }

  /**
   * POST /api/expenses/bank/consent/verify
   */
  public static async verifyConsent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { consentHandle, otp, fipId } = req.body;
      if (!consentHandle || !otp) {
        res.status(400).json({ success: false, message: 'Consent handle and OTP are required' });
        return;
      }

      const result = await AccountAggregatorService.verifyConsentOtp(userId, consentHandle, otp, fipId);
      res.json({
        success: true,
        message: 'Bank account linked and synchronized successfully!',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to verify OTP' });
    }
  }

  /**
   * POST /api/expenses/bank/sync
   */
  public static async syncTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { bankAccountId } = req.body;
      const result = await AccountAggregatorService.syncBankTransactions(userId, bankAccountId);

      res.json({
        success: true,
        message: `Sync complete: ${result.syncedCount} new transactions saved (${result.duplicateCount} duplicates skipped).`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to sync bank transactions' });
    }
  }

  /**
   * GET /api/expenses/bank/accounts
   */
  public static async getConnectedAccounts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const accounts = await AccountAggregatorService.getConnectedAccounts(userId);
      res.json({
        success: true,
        data: accounts,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch connected accounts' });
    }
  }

  /**
   * DELETE /api/expenses/bank/accounts/:id
   */
  public static async disconnectAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id);
      await AccountAggregatorService.disconnectAccount(userId, id);

      res.json({
        success: true,
        message: 'Bank account unlinked successfully',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to unlink bank account' });
    }
  }
}
