const request = require('supertest');
const app = require('../server');

describe('Checkout service health', () => {
  test('GET / returns welcome message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.text).toContain('Welcome to the Shopping App API!');
  });
});
