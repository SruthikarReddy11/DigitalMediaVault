import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';
import { TransactionCategorizer } from '../services/transactionCategorizer';

describe('RBI Account Aggregator (AA) Bank Sync Tests', () => {
  let userCookie: any;
  let testUserId: string;
  let consentHandle: string;
  let linkedBankAccountId: string;

  beforeAll(async () => {
    // Register unique test user
    const username = `aa_user_${Date.now()}`;
    const email = `${username}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bank Sync Tester',
        username,
        email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(201);
    userCookie = res.headers['set-cookie'];

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();
    testUserId = user!.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await prisma.expense.deleteMany({ where: { userId: testUserId } });
      await prisma.bankAccountLink.deleteMany({ where: { userId: testUserId } });
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  describe('Transaction Categorizer Unit Tests', () => {
    it('should correctly categorize Food expenses', () => {
      const parsed = TransactionCategorizer.categorize('UPI/SWIGGY/98234812/swiggy@icici', 'EXPENSE');
      expect(parsed.category).toBe('Food');
      expect(parsed.paymentMethod).toBe('UPI');
      expect(parsed.cleanMerchant).toBe('Swiggy');
    });

    it('should correctly categorize Groceries expenses', () => {
      const parsed = TransactionCategorizer.categorize('UPI/ZEPTO/38947102/zepto@hdfcbank', 'EXPENSE');
      expect(parsed.category).toBe('Groceries');
      expect(parsed.paymentMethod).toBe('UPI');
      expect(parsed.cleanMerchant).toBe('Zepto');
    });

    it('should correctly categorize Transport expenses', () => {
      const parsed = TransactionCategorizer.categorize('UPI/UBER INDIA/93847291/uber@hdfc', 'EXPENSE');
      expect(parsed.category).toBe('Transport');
      expect(parsed.paymentMethod).toBe('UPI');
    });

    it('should correctly categorize Salary income', () => {
      const parsed = TransactionCategorizer.categorize('ACH CREDIT/CORP SALARY/INFOSYS LTD', 'INCOME');
      expect(parsed.category).toBe('Salary');
    });
  });

  describe('Account Aggregator API Endpoints', () => {
    it('should get supported banks list', async () => {
      const res = await request(app)
        .get('/api/expenses/bank/supported-banks')
        .set('Cookie', userCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((b: any) => b.fipId === 'HDFC-FIP')).toBe(true);
    });

    it('should initiate consent request with mobile number and bank', async () => {
      const res = await request(app)
        .post('/api/expenses/bank/consent/initiate')
        .set('Cookie', userCookie)
        .send({
          mobileNumber: '9876543210',
          fipId: 'HDFC-FIP',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.consentHandle).toBeTruthy();
      expect(res.body.data.bankName).toBe('HDFC Bank');
      consentHandle = res.body.data.consentHandle;
    });

    it('should verify OTP and link bank accounts', async () => {
      const res = await request(app)
        .post('/api/expenses/bank/consent/verify')
        .set('Cookie', userCookie)
        .send({
          consentHandle,
          otp: '123456',
          fipId: 'HDFC-FIP',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.linkedAccounts.length).toBeGreaterThan(0);
      expect(res.body.data.linkedAccounts[0].bankName).toBe('HDFC Bank');
      linkedBankAccountId = res.body.data.linkedAccounts[0].id;
    });

    it('should list connected bank accounts', async () => {
      const res = await request(app)
        .get('/api/expenses/bank/accounts')
        .set('Cookie', userCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].consentStatus).toBe('ACTIVE');
    });

    it('should sync bank transactions into expenses table without manual entry', async () => {
      const res = await request(app)
        .post('/api/expenses/bank/sync')
        .set('Cookie', userCookie)
        .send({
          bankAccountId: linkedBankAccountId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountsSynced).toBe(1);

      // Verify that transactions exist in database
      const userExpenses = await prisma.expense.findMany({
        where: { userId: testUserId },
      });
      expect(userExpenses.length).toBeGreaterThan(0);
      expect(userExpenses.some((e) => e.bankName === 'HDFC Bank')).toBe(true);
    });

    it('should deduplicate already synced transactions on subsequent sync', async () => {
      const res = await request(app)
        .post('/api/expenses/bank/sync')
        .set('Cookie', userCookie)
        .send({
          bankAccountId: linkedBankAccountId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.syncedCount).toBe(0);
      expect(res.body.data.duplicateCount).toBeGreaterThan(0);
    });

    it('should disconnect / unlink bank account', async () => {
      const res = await request(app)
        .delete(`/api/expenses/bank/accounts/${linkedBankAccountId}`)
        .set('Cookie', userCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const link = await prisma.bankAccountLink.findUnique({
        where: { id: linkedBankAccountId },
      });
      expect(link?.consentStatus).toBe('REVOKED');
    });
  });
});
