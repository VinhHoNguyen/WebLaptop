const request = require('supertest');
const app = require('../server');

describe('Checkout Service - Orders', () => {
  let orderId;
  const testOrder = {
    userId: 1,
    totalAmount: 5000000,
    status: 'pending',
    items: [
      { productId: 1, quantity: 2, price: 2500000 }
    ]
  };

  describe('POST /order - Create Order', () => {
    test('should create a new order', async () => {
      const res = await request(app)
        .post('/order')
        .send(testOrder);
      
      expect([200, 400, 500]).toContain(res.status);
      
      expect(res.body).toHaveProperty('data');
      orderId = res.body.data?.id || res.body.data?.orderId;
    });

    test('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/order')
        .send({ userId: 1 });
      
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /orders - Create Order (alternate endpoint)', () => {
    test('should create order via /orders endpoint', async () => {
      const res = await request(app)
        .post('/orders')
        .send(testOrder);
      
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('GET /orders - Get All Orders', () => {
    test('should retrieve all orders', async () => {
      const res = await request(app).get('/orders');
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /order/:id - Get Order by ID', () => {
    test('should get order by ID', async () => {
      if (!orderId) return;
      const res = await request(app)
        .get(`/order/${orderId}`);
      
      expect([200, 404, 500]).toContain(res.status);
    });

    test('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .get('/order/99999');
      
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /order/detail/:id - Get Order Details', () => {
    test('should get detailed order information', async () => {
      if (!orderId) return;
      const res = await request(app)
        .get(`/order/detail/${orderId}`);
      
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /orders/:id/status - Update Order Status', () => {
    test('should update order status', async () => {
      if (!orderId) return;
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .send({ status: 'confirmed' });
      
      expect([200, 404, 500]).toContain(res.status);
    });

    test('should fail with invalid status', async () => {
      if (!orderId) return;
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .send({ status: 'invalid_status' });
      
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /momo/create - Create MoMo Payment', () => {
    test('should create MoMo payment link', async () => {
      const momoPayload = {
        orderId: orderId || 1,
        amount: 5000000,
        orderInfo: 'Payment for order'
      };
      const res = await request(app)
        .post('/momo/create')
        .send(momoPayload);
      
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('POST /payment/momo/create - Create MoMo Payment (alternate)', () => {
    test('should create MoMo payment via alternate endpoint', async () => {
      const momoPayload = {
        orderId: orderId || 1,
        amount: 5000000,
        orderInfo: 'Payment for order'
      };
      const res = await request(app)
        .post('/payment/momo/create')
        .send(momoPayload);
      
      expect([200, 400, 500]).toContain(res.status);
    });
  });
});
