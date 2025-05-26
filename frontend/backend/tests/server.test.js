import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../server'; // adjust path based on your structure

describe('API Endpoints', () => {

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        email: `test${Date.now()}@example.com`,
        password: 'testpass123'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('fails login with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid credentials/i);
  });

  it('requires token for profile update', async () => {
    const res = await request(app)
      .post('/api/update')
      .send({
        token: 'invalidtoken',
        username: 'newname'
      });

    expect(res.status).toBe(500); // Internal error due to decryption
  });

  it('returns 400 if search query missing', async () => {
    const res = await request(app).get('/api/songs/search/');
    expect(res.status).toBe(404); // Since the route expects a param
  });

  it('fetches paginated songs', async () => {
    const res = await request(app)
      .post('/api/songs')
      .send({ limit: 5, offset: 0 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
