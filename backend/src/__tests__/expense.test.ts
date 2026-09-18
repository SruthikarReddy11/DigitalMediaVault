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
  });

  it('should create a new outgoing expense', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Cookie', userCookie)
      .send({
        type: 'EXPENSE',
        amount: 2450.5,
        person: 'Green Grocers',
        category: 'Groceries',
        reason: 'Weekly vegetable and fruit shopping',
        paymentMethod: 'UPI',
        date: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(2450.5);
    expect(res.body.data.person).toBe('Green Grocers');
    expect(res.body.data.category).toBe('Groceries');
    expect(res.body.data.type).toBe('EXPENSE');

    createdExpenseId = res.body.data.id;
  });

  it('should create an incoming expense (income)', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Cookie', userCookie)
      .send({
        type: 'INCOME',
        amount: 50000,
        person: 'Client ABC',
        category: 'Freelance',
        reason: 'Web development milestone payment',
        paymentMethod: 'Bank Transfer',
        date: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('INCOME');
    expect(res.body.data.amount).toBe(50000);
  });

  it('should list expenses with filtering and search', async () => {
    const res = await request(app)
      .get('/api/expenses?search=Grocers')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].person).toBe('Green Grocers');
  });

  it('should update an existing expense', async () => {
    const res = await request(app)
      .put(`/api/expenses/${createdExpenseId}`)
      .set('Cookie', userCookie)
      .send({
        amount: 2800,
        reason: 'Weekly vegetable, fruits, and organic dairy',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(2800);
    expect(res.body.data.reason).toBe('Weekly vegetable, fruits, and organic dairy');
  });

  it('should seed realistic sample multi-month data and execute peak-month analytics algorithm', async () => {
    // Seed sample data
    const seedRes = await request(app)
      .post('/api/expenses/seed-sample')
      .set('Cookie', userCookie);

    expect(seedRes.status).toBe(200);
    expect(seedRes.body.success).toBe(true);
    expect(seedRes.body.data.count).toBeGreaterThanOrEqual(20);

    // Call analytics endpoint
    const analyticsRes = await request(app)
      .get('/api/expenses/analytics')
      .set('Cookie', userCookie);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.success).toBe(true);

    const analytics = analyticsRes.body.data;
    expect(analytics.hasData).toBe(true);
    expect(analytics.summary.totalIncome).toBeGreaterThan(0);
    expect(analytics.summary.totalExpense).toBeGreaterThan(0);
    expect(analytics.summary.netBalance).toBeDefined();
    expect(analytics.monthlyData.length).toBeGreaterThanOrEqual(4);

    // Verify Peak Month Algorithm
    expect(analytics.peakMonthAnalysis).toBeTruthy();
    const peak = analytics.peakMonthAnalysis;
    expect(peak.peakMonthKey).toBeDefined();
    expect(peak.totalExpense).toBeGreaterThan(peak.meanMonthlyExpense);
    expect(peak.percentAboveAverage).toBeGreaterThan(0);
    expect(peak.topDriverCategories.length).toBeGreaterThan(0);
    expect(peak.largestExpense).toBeTruthy();
    expect(peak.diagnosticInsights.length).toBeGreaterThan(0);

    // Diagnostic insights should mention the peak spend
    const insightText = peak.diagnosticInsights.join(' ');
    expect(insightText).toContain(peak.peakMonthName);
  });

  it('should export expenses as CSV format', async () => {
    const res = await request(app)
      .get('/api/expenses/export')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Date,Type,Amount,Currency,Person,Category,Reason');
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
