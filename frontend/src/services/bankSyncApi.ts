import { api } from './api';

export interface BankFIP {
  fipId: string;
  name: string;
  code: string;
  logoColor: string;
  supportedAccountTypes: string[];
}

export interface InitiateConsentResponse {
  consentHandle: string;
  mobileNumber: string;
  bankName: string;
  expiresInSeconds: number;
  mode: 'simulator' | 'setu';
  mockOtpNotice?: string;
}

export interface LinkedAccountItem {
  id: string;
  bankName: string;
  accountNumberMask: string;
  accountType: string;
}

export interface VerifyConsentResponse {
  consentId: string;
  status: string;
  linkedAccounts: LinkedAccountItem[];
}

export interface ConnectedAccount {
  id: string;
  provider: string;
  fipId: string;
  bankName: string;
  accountNumberMask: string;
  accountType: string;
  consentStatus: string;
  lastSyncedAt: string | null;
  createdAt: string;
  _count?: {
    expenses: number;
  };
}

export interface SyncResult {
  syncedCount: number;
  duplicateCount: number;
  accountsSynced: number;
  lastSyncedAt: string;
}

export const bankSyncApi = {
  /**
   * Get supported banks (FIPs)
   */
  getSupportedBanks: async (): Promise<BankFIP[]> => {
    const res = await api.get('/expenses/bank/supported-banks');
    return res.data.data;
  },

  /**
   * Step 1: Initiate Consent
   */
  initiateConsent: async (mobileNumber: string, fipId: string): Promise<InitiateConsentResponse> => {
    const res = await api.post('/expenses/bank/consent/initiate', {
      mobileNumber,
      fipId,
    });
    return res.data.data;
  },

  /**
   * Step 2: Verify OTP and link accounts
   */
  verifyConsent: async (consentHandle: string, otp: string, fipId: string): Promise<VerifyConsentResponse> => {
    const res = await api.post('/expenses/bank/consent/verify', {
      consentHandle,
      otp,
      fipId,
    });
    return res.data.data;
  },

  /**
   * Sync transactions from linked bank accounts
   */
  syncTransactions: async (bankAccountId?: string): Promise<SyncResult> => {
    const res = await api.post('/expenses/bank/sync', { bankAccountId });
    return res.data.data;
  },

  /**
   * Get all connected bank accounts
   */
  getConnectedAccounts: async (): Promise<ConnectedAccount[]> => {
    const res = await api.get('/expenses/bank/accounts');
    return res.data.data;
  },

  /**
   * Disconnect a bank account (and delete its synced transactions)
   */
  disconnectAccount: async (id: string, deleteExpenses: boolean = true): Promise<void> => {
    await api.delete(`/expenses/bank/accounts/${id}?deleteExpenses=${deleteExpenses}`);
  },

  /**
   * Clear all synced bank transactions and linked accounts
   */
  clearAllSyncedData: async (): Promise<{ deletedExpensesCount: number; deletedAccountsCount: number }> => {
    const res = await api.delete('/expenses/bank/clear-synced');
    return res.data.data;
  },
};
