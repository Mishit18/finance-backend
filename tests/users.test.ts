import request from 'supertest';
import app from '../src/app';
import { cleanDatabase, seedTestData, prisma } from './setup';

async function loginAs(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });
  return res.body.data.token;
}

describe('User Management Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/users', () => {
    it('admin should list all users', async () => {
      const token = await loginAs('admin@test.com');

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(4);
      // Should not return passwords
      res.body.data.forEach((u: any) => {
        expect(u.password).toBeUndefined();
      });
    });

    it('viewer should NOT list users', async () => {
      const token = await loginAs('viewer@test.com');

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('analyst should NOT list users', async () => {
      const token = await loginAs('analyst@test.com');

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('admin should update a user role', async () => {
      const token = await loginAs('admin@test.com');

      // Get viewer's ID
      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      const viewer = listRes.body.data.find((u: any) => u.email === 'viewer@test.com');

      const res = await request(app)
        .patch(`/api/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ANALYST' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('ANALYST');
    });

    it('should reject invalid role value', async () => {
      const token = await loginAs('admin@test.com');

      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      const viewer = listRes.body.data.find((u: any) => u.email === 'viewer@test.com');

      const res = await request(app)
        .patch(`/api/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'SUPERADMIN' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('admin should deactivate a user', async () => {
      const token = await loginAs('admin@test.com');

      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      const viewer = listRes.body.data.find((u: any) => u.email === 'viewer@test.com');

      const res = await request(app)
        .patch(`/api/users/${viewer.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INACTIVE');

      // Deactivated user should not be able to login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'viewer@test.com', password: 'password123' });

      expect(loginRes.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('admin should soft-delete a user', async () => {
      const token = await loginAs('admin@test.com');

      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      const viewer = listRes.body.data.find((u: any) => u.email === 'viewer@test.com');

      const res = await request(app)
        .delete(`/api/users/${viewer.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Deleted user should not appear in listing
      const afterRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      const emails = afterRes.body.data.map((u: any) => u.email);
      expect(emails).not.toContain('viewer@test.com');
    });
  });
});
