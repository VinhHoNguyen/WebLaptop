const request = require('supertest');
const app = require('../server');

describe('Identity service health', () => {
  test('GET /health returns service UP', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'UP');
  });
});
