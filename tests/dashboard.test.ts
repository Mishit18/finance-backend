import request from 'supertest';
import app from '../src/app';
import { cleanDatabase, seedTestData, prisma } from './setup';

async function loginAs(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });
  return res.body.data.token;
}

describe('Dashboard Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/dashboard/summary', () => {
    it('admin should see summary of all transactions', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.totalIncome).toBeDefined();
      expect(data.totalExpense).toBeDefined();
      expect(data.netBalance).toBe(data.totalIncome - data.totalExpense);
      expect(Array.isArray(data.categoryTotals)).toBe(true);
      expect(Array.isArray(data.recentActivity)).toBe(true);
      expect(Array.isArray(data.monthlyTrends)).toBe(true);

      // Admin sees all — total income should be 5000 + 4500 = 9500
      expect(data.totalIncome).toBe(9500);
    });

    it('viewer should see only own summary', async () => {
      const token = await loginAs('viewer@test.com');

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const data = res.body.data;
      // Viewer only has 1 expense of 800
      expect(data.totalExpense).toBe(800);
      expect(data.totalIncome).toBe(0);
      expect(data.netBalance).toBe(-800);
    });

    it('category totals should have income, expense, and net', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      const cats = res.body.data.categoryTotals;
      cats.forEach((c: any) => {
        expect(c.category).toBeDefined();
        expect(typeof c.income).toBe('number');
        expect(typeof c.expense).toBe('number');
        expect(typeof c.net).toBe('number');
        expect(c.net).toBe(c.income - c.expense);
      });
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/insights', () => {
    it('analyst should access insights', async () => {
      const token = await loginAs('analyst@test.com');

      const res = await request(app)
        .get('/api/dashboard/insights')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      res.body.data.forEach((insight: any) => {
        expect(insight.category).toBeDefined();
        expect(typeof insight.totalIncome).toBe('number');
        expect(typeof insight.totalExpense).toBe('number');
        expect(typeof insight.transactionCount).toBe('number');
        expect(typeof insight.net).toBe('number');
      });
    });

    it('admin should access insights', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/dashboard/insights')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('viewer should NOT access insights', async () => {
      const token = await loginAs('viewer@test.com');

      const res = await request(app)
        .get('/api/dashboard/insights')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
