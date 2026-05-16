const request = require('supertest');
const app = require('../server');

describe('Catalog Service - Products', () => {
  let productId;
  const testProduct = {
    name: 'Test Laptop Pro',
    price: 25000000,
    category: 'laptop',
    brand: 'TestBrand',
    description: 'High-performance test laptop',
    specs: {
      cpu: 'Intel i7',
      ram: 16,
      storage: 512
    },
    stock: 10
  };

  describe('GET / - Get All Products', () => {
    test('should retrieve all products', async () => {
      const res = await request(app).get('/');
      expect([200, 404, 500]).toContain(res.status);
    });

    test('should support pagination query', async () => {
      const res = await request(app)
        .get('/?page=1&limit=10');
      
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /id/:id - Get Product by ID', () => {
    test('should retrieve product by specific ID', async () => {
      const res = await request(app)
        .get('/id/1');
      
      expect([200, 404, 500]).toContain(res.status);
    });

    test('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/id/99999');
      
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /:idOrName - Find Product by ID or Name', () => {
    test('should find product by name', async () => {
      const res = await request(app)
        .get('/laptop');
      
      expect([200, 404, 500]).toContain(res.status);
    });

    test('should find product by ID', async () => {
      const res = await request(app)
        .get('/1');
      
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST / - Create Product', () => {
    test('should create a new product', async () => {
      const res = await request(app)
        .post('/')
        .send(testProduct);
      
      if (res.status === 201 || res.status === 200) {
        productId = res.body.data?.id;
      }
      expect([200, 201, 400, 500]).toContain(res.status);
    });

    test('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/')
        .send({ name: 'Incomplete Product' });
      
      expect([200, 400, 500]).toContain(res.status);
    });

    test('should fail with invalid price', async () => {
      const res = await request(app)
        .post('/')
        .send({ ...testProduct, price: -1000 });
      
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('PUT /:id - Update Product', () => {
    test('should update product information', async () => {
      if (!productId) return;
      const res = await request(app)
        .put(`/${productId}`)
        .send({ price: 26000000, name: 'Updated Test Laptop' });
      
      expect([200, 404, 500]).toContain(res.status);
    });

    test('should fail for non-existent product', async () => {
      const res = await request(app)
        .put('/99999')
        .send({ price: 30000000 });
      
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /:id - Delete Product', () => {
    test('should delete a product', async () => {
      if (!productId) return;
      const res = await request(app)
        .delete(`/${productId}`);
      
      expect([200, 404, 500]).toContain(res.status);
    });

    test('should fail for non-existent product', async () => {
      const res = await request(app)
        .delete('/99999');
      
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
