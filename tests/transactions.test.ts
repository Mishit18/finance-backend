import request from 'supertest';
import app from '../src/app';
import { cleanDatabase, seedTestData, prisma } from './setup';

// Helper to get auth token
async function loginAs(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });
  return res.body.data.token;
}

describe('Transaction Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/transactions', () => {
    it('admin should create a transaction', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 1500,
          type: 'INCOME',
          category: 'Freelance',
          date: '2024-03-01T00:00:00.000Z',
          description: 'Client payment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(1500);
      expect(res.body.data.type).toBe('INCOME');
      expect(res.body.data.category).toBe('Freelance');
    });

    it('analyst should create a transaction', async () => {
      const token = await loginAs('analyst@test.com');

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 200,
          type: 'EXPENSE',
          category: 'Office Supplies',
          date: '2024-03-05T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
    });

    it('viewer should NOT create a transaction', async () => {
      const token = await loginAs('viewer@test.com');

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 100,
          type: 'EXPENSE',
          category: 'Groceries',
          date: '2024-03-01T00:00:00.000Z',
        });

      expect(res.status).toBe(403);
    });

    it('should reject negative amount', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -100,
          type: 'EXPENSE',
          category: 'Test',
          date: '2024-03-01T00:00:00.000Z',
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid type', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 100,
          type: 'TRANSFER',
          category: 'Test',
          date: '2024-03-01T00:00:00.000Z',
        });

      expect(res.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .send({
          amount: 100,
          type: 'EXPENSE',
          category: 'Test',
          date: '2024-03-01T00:00:00.000Z',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/transactions', () => {
    it('admin should see all transactions', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(5); // All seeded transactions
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(5);
    });

    it('viewer should only see own transactions', async () => {
      const token = await loginAs('viewer@test.com');

      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      // Verify all returned transactions belong to viewer
      res.body.data.forEach((t: any) => {
        expect(t.user.email).toBe('viewer@test.com');
      });
    });

    it('should support pagination', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/transactions?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalPages).toBe(3);
    });

    it('should filter by type', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/transactions?type=INCOME')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((t: any) => {
        expect(t.type).toBe('INCOME');
      });
    });

    it('should filter by category', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/transactions?category=Salary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((t: any) => {
        expect(t.category).toBe('Salary');
      });
    });

    it('should filter by date range', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/transactions?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((t: any) => {
        const date = new Date(t.date);
        expect(date.getMonth()).toBe(0); // January
      });
    });

    it('should support search in description and category', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/transactions?search=salary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('admin should update any transaction', async () => {
      const token = await loginAs('admin@test.com');

      // Get a transaction first
      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      const txId = listRes.body.data[0].id;

      const res = await request(app)
        .put(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 9999 });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(9999);
    });

    it('analyst should update own transaction', async () => {
      const token = await loginAs('analyst@test.com');

      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      const txId = listRes.body.data[0].id;

      const res = await request(app)
        .put(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated description');
    });

    it('viewer should NOT update transactions', async () => {
      const token = await loginAs('viewer@test.com');

      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      const txId = listRes.body.data[0].id;

      const res = await request(app)
        .put(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/transactions/:id (soft delete)', () => {
    it('admin should soft-delete a transaction', async () => {
      const token = await loginAs('admin@test.com');

      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      const txId = listRes.body.data[0].id;
      const countBefore = listRes.body.pagination.total;

      const res = await request(app)
        .delete(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify it's hidden from listing
      const afterRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(afterRes.body.pagination.total).toBe(countBefore - 1);
    });

    it('analyst should NOT delete transactions', async () => {
      const token = await loginAs('analyst@test.com');

      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      const txId = listRes.body.data[0].id;

      const res = await request(app)
        .delete(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('viewer should NOT delete transactions', async () => {
      const token = await loginAs('viewer@test.com');

      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      const txId = listRes.body.data[0].id;

      const res = await request(app)
        .delete(`/api/transactions/${txId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
