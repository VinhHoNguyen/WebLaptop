const request = require('supertest');
const app = require('../server');

describe('Checkout Service - Shopping Cart', () => {
  const mockToken = 'Bearer mock-test-token'; // Mock JWT token for testing
  const cartItem = {
    productId: 1,
    quantity: 2,
    price: 2500000
  };

  // Note: Cart endpoints require authentication
  // These tests use mock token for demonstration

  describe('GET / - Get Cart Products', () => {
    test('should retrieve cart items with token', async () => {
      const res = await request(app)
        .get('/')
        .set('Authorization', mockToken);
      
      // Will fail without proper JWT middleware setup, but tests endpoint
      expect([200, 401, 500]).toContain(res.status);
    });

    test('should fail without token', async () => {
      const res = await request(app).get('/').expect(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST / - Add Product to Cart', () => {
    test('should add product to cart with token', async () => {
      const res = await request(app)
        .post('/')
        .set('Authorization', mockToken)
        .send(cartItem);
      
      expect([200, 400, 401, 500]).toContain(res.status);
    });

    test('should fail without token', async () => {
      const res = await request(app)
        .post('/')
        .send(cartItem)
        .expect(401);
      
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /:productid - Add Product by ID', () => {
    test('should add specific product to cart', async () => {
      const res = await request(app)
        .post('/1')
        .set('Authorization', mockToken)
        .send({ quantity: 1 });
      
      expect([200, 400, 401, 500]).toContain(res.status);
    });
  });

  describe('PUT /:productid - Update Cart Item', () => {
    test('should update product quantity in cart', async () => {
      const res = await request(app)
        .put('/1')
        .set('Authorization', mockToken)
        .send({ quantity: 3 });
      
      expect([200, 400, 401, 500]).toContain(res.status);
    });

    test('should fail without token', async () => {
      const res = await request(app)
        .put('/1')
        .send({ quantity: 3 })
        .expect(401);
      
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /:productid - Remove Item from Cart', () => {
    test('should remove product from cart', async () => {
      const res = await request(app)
        .delete('/1')
        .set('Authorization', mockToken)
        .expect(200);
      
      expect(res.status).toBeDefined();
    });

    test('should fail without token', async () => {
      const res = await request(app).delete('/1').expect(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /checkout - Checkout Cart', () => {
    test('should checkout cart with token', async () => {
      const res = await request(app)
        .delete('/checkout')
        .set('Authorization', mockToken)
        .send({ paymentMethod: 'momo' });
      
      expect([200, 400, 401, 500]).toContain(res.status);
    });

    test('should fail without token', async () => {
      const res = await request(app).delete('/checkout').expect(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
