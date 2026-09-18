import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';

describe('Expense Tracker & Data Analytics Algorithm Tests', () => {
  let userCookie: any;
  let testUserId: string;
  let createdExpenseId: string;

  beforeAll(async () => {
    // Register unique test user
    const username = `exp_user_${Date.now()}`;
    const email = `${username}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Expense Tester',
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
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  it('should return empty analytics when user has no expenses', async () => {
    const res = await request(app)
      .get('/api/expenses/analytics')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasData).toBe(false);
    expect(res.body.data.summary.totalExpense).toBe(0);
    expect(res.body.data.summary.totalIncome).toBe(0);
    expect(res.body.data.summary.savings).toBe(0);
  });

  it('should create an expense with category, amount, date, payment method, optional description and notes', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Cookie', userCookie)
      .send({
        type: 'EXPENSE',
        amount: 2500,
        category: 'Groceries',
        date: new Date().toISOString(),
        paymentMethod: 'UPI',
        description: 'Supermarket weekly essentials',
        notes: 'Bought organic pulses and milk',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(2500);
    expect(res.body.data.category).toBe('Groceries');
    expect(res.body.data.description).toBe('Supermarket weekly essentials');
    expect(res.body.data.notes).toBe('Bought organic pulses and milk');
    expect(res.body.data.paymentMethod).toBe('UPI');
    expect(res.body.data.type).toBe('EXPENSE');

    createdExpenseId = res.body.data.id;
  });

  it('should create an incoming expense (income)', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Cookie', userCookie)
      .send({
        type: 'INCOME',
        amount: 60000,
        category: 'Salary',
        date: new Date().toISOString(),
        paymentMethod: 'Bank Transfer',
        description: 'Monthly payroll credit',
        notes: 'Direct deposit',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('INCOME');
    expect(res.body.data.amount).toBe(60000);
    expect(res.body.data.category).toBe('Salary');
  });

  it('should list expenses with search and filtering', async () => {
    const res = await request(app)
      .get('/api/expenses?search=Groceries')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].category).toBe('Groceries');
  });

  it('should update an existing expense', async () => {
    const res = await request(app)
      .put(`/api/expenses/${createdExpenseId}`)
      .set('Cookie', userCookie)
      .send({
        amount: 2900,
        description: 'Supermarket weekly essentials and organic fruit basket',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(2900);
    expect(res.body.data.description).toContain('organic fruit basket');
  });

  it('should calculate analytics with total expenses, total income, savings, category-wise and monthly spending', async () => {
    const analyticsRes = await request(app)
      .get('/api/expenses/analytics')
      .set('Cookie', userCookie);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.success).toBe(true);

    const analytics = analyticsRes.body.data;
    expect(analytics.hasData).toBe(true);
    expect(analytics.summary.totalIncome).toBe(60000);
    expect(analytics.summary.totalExpense).toBe(2900);
    expect(analytics.summary.savings).toBe(57100);
    expect(analytics.summary.savingsRate).toBeGreaterThan(0);
    expect(analytics.categoryWiseSpending.length).toBeGreaterThanOrEqual(1);
    expect(analytics.monthlySpending.length).toBeGreaterThanOrEqual(1);
    expect(analytics.spendingTrends.length).toBeGreaterThanOrEqual(1);
  });

  it('should export expenses as CSV format', async () => {
    const res = await request(app)
      .get('/api/expenses/export')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Date,Type,Amount,Currency,Category');
  });

  it('should delete an expense', async () => {
    const res = await request(app)
      .delete(`/api/expenses/${createdExpenseId}`)
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await prisma.expense.findUnique({ where: { id: createdExpenseId } });
    expect(check).toBeNull();
  });
});
