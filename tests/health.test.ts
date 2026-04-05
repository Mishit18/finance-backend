import request from 'supertest';
import app from '../src/app';

describe('Health & Error Handling', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Route not found');
  });

  it('should return 401 for protected routes without token', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('should return 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', 'Bearer invalid-token-here');

    expect(res.status).toBe(401);
  });
});
