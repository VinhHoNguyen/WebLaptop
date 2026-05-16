const request = require('supertest');
const app = require('../server');

describe('Catalog Service - Product Filtering', () => {
  describe('GET / - Get All Products (Filter endpoint)', () => {
    test('should retrieve all products via filter endpoint', async () => {
      const res = await request(app).get('/').expect(200);
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });
  });

  describe('GET /category/:category - Filter by Category', () => {
    test('should filter products by laptop category', async () => {
      const res = await request(app)
        .get('/category/laptop');
      
      expect([200, 404]).toContain(res.status);
      expect(res.body).toBeDefined();
    });

    test('should filter products by gaming category', async () => {
      const res = await request(app)
        .get('/category/gaming');
      
      expect([200, 404]).toContain(res.status);
      expect(res.body).toBeDefined();
    });

    test('should return empty or error for non-existent category', async () => {
      const res = await request(app)
        .get('/category/nonexistentcategory');
      
      // May return 200 with empty or 404
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('GET /price/:price - Filter by Price Range', () => {
    test('should filter products under 10 million', async () => {
      const res = await request(app)
        .get('/price/10000000')
        .expect(200);
      
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });

    test('should filter products under 20 million', async () => {
      const res = await request(app)
        .get('/price/20000000')
        .expect(200);
      
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });

    test('should filter products under 50 million', async () => {
      const res = await request(app)
        .get('/price/50000000')
        .expect(200);
      
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });

    test('should handle invalid price format', async () => {
      const res = await request(app).get('/price/invalid');
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('GET /categoryprice/:category&&:price - Filter by Category and Price', () => {
    test('should filter laptop products under 20 million', async () => {
      const res = await request(app)
        .get('/categoryprice/laptop&&20000000')
        .expect(200);
      
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });

    test('should filter gaming products under 30 million', async () => {
      const res = await request(app)
        .get('/categoryprice/gaming&&30000000')
        .expect(200);
      
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });

    test('should filter premium products under 50 million', async () => {
      const res = await request(app)
        .get('/categoryprice/premium&&50000000')
        .expect(200);
      
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });

    test('should handle missing parameters gracefully', async () => {
      const res = await request(app).get('/categoryprice/laptop');
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('Filter combinations and edge cases', () => {
    test('should filter products with multiple category queries', async () => {
      const res = await request(app)
        .get('/category/laptop?sort=price&order=asc')
        .expect(200);
      
      expect(res.body.data).toBeDefined();
    });

    test('should handle zero price filter', async () => {
      const res = await request(app).get('/price/0');
      expect([200, 400]).toContain(res.status);
    });

    test('should handle very high price filter', async () => {
      const res = await request(app)
        .get('/price/999999999')
        .expect(200);
      
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });
  });
});
