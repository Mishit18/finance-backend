import request from 'supertest';
import app from '../src/app';
import { cleanDatabase, seedTestData, prisma } from './setup';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newuser@test.com');
      expect(res.body.data.user.role).toBe('VIEWER');
      expect(res.body.data.token).toBeDefined();
      // Password should never be returned
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should register a user with a specific role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'analyst@new.com',
          password: 'password123',
          name: 'New Analyst',
          role: 'ANALYST',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('ANALYST');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'dup@test.com',
          password: 'password123',
          name: 'User One',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'dup@test.com',
          password: 'password123',
          name: 'User Two',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
          name: 'Bad User',
        });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'short@test.com',
          password: '123',
          name: 'Short Pass',
        });

      expect(res.status).toBe(400);
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'badrole@test.com',
          password: 'password123',
          name: 'Bad Role',
          role: 'SUPERADMIN',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await seedTestData();
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@test.com');
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
    });

    it('should reject inactive user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('inactive');
    });
  });
});
