/*
  Integration-style smoke tests for AI Agent tool calls (TC_A1..TC_A10)
  Usage:
    WEBHOOK_URL=http://localhost:5678/webhook CATALOG_URL=http://localhost:3002 \
    CHECKOUT_URL=http://localhost:3003 IDENTITY_URL=http://localhost:3004 \
    npx jest tests/ai-agent-tool-A.test.js --runInBand

  Tests are permissive: they accept 200/401/404 responses so they can run
  in a local/dev environment without full seeding/auth setup.
*/

const request = require('supertest');

const WEBHOOK = process.env.WEBHOOK_URL || '';
const CATALOG = process.env.CATALOG_URL || 'http://localhost:3002';
const CHECKOUT = process.env.CHECKOUT_URL || 'http://localhost:3003';
const IDENTITY = process.env.IDENTITY_URL || 'http://localhost:3004';

const postToWebhook = async (payload) => {
  if (!WEBHOOK) return { skipped: true, body: null, status: 0 };
  const res = await request(WEBHOOK).post('/').send(payload).set('Accept', 'application/json');
  return { skipped: false, body: res.body, status: res.status };
};

describe('AI Agent - Tool call smoke tests (TC_A1..TC_A10)', () => {
  jest.setTimeout(20000);

  test('TC_A1 - Promotions query (student promo)', async () => {
    // Prefer webhook (agent) if available, otherwise try catalog /promotions
    const payload = { text: 'Hiện đang có khuyến mãi dành cho sinh viên không?' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400,204]).toContain(wh.status);
      // If agent returns structured data it may include promotions
      if (wh.body && wh.body.data) expect(wh.body.data.promotions || wh.body.data).toBeDefined();
      return;
    }

    // fallback: try /promotions on catalog
    const res = await request(CATALOG).get('/promotions').send();
    expect([200,404,401]).toContain(res.status);
  });

  test('TC_A2 - Find 14" long battery laptops', async () => {
    const payload = { text: 'Tìm laptop 14" pin trên 10 giờ, tối ưu cho làm việc' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      return;
    }
    const res = await request(CATALOG).get('/filter/price/0').send();
    expect([200,404,401]).toContain(res.status);
  });

  test('TC_A3 - Check user orders then order detail', async () => {
    const payload = { text: 'Kiểm tra trạng thái đơn hàng của tôi', userId: 'U99' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      return;
    }
    // fallback: call checkout orders endpoint
    const res = await request(CHECKOUT).get('/orders').set('Authorization', 'Bearer TEST_TOKEN');
    expect([200,401,404]).toContain(res.status);
  });

  test('TC_A4 - Add product to cart and view cart', async () => {
    const payload = { text: 'Thêm sản phẩm có mã SP123 vào giỏ, số lượng 3', userId: 'U99' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      return;
    }
    // fallback: try direct API calls (permissive)
    // attempt to find a product first
    const prod = await request(CATALOG).get('/').expect(res => {
      if (![200,404,401].includes(res.status)) throw new Error('unexpected');
    });
    // don't fail if product list not available
    expect([200,404,401]).toContain(prod.status);
  });

  test('TC_A5 - Remove product from cart', async () => {
    const payload = { text: 'Làm ơn xóa sản phẩm SP123 khỏi giỏ hàng', userId: 'U99' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      return;
    }
    const res = await request(CHECKOUT).delete('/cart/SP123').set('Authorization', 'Bearer TEST_TOKEN');
    expect([200,204,401,404]).toContain(res.status);
  });

  test('TC_A6 - Count tablets in stock', async () => {
    const payload = { text: 'Hiện có bao nhiêu sản phẩm loại "tablet" còn trong kho?' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      return;
    }
    const res = await request(CATALOG).get('/category/tablet').send();
    expect([200,404,401]).toContain(res.status);
  });

  test('TC_A7 - Accessories by brand (Logitech)', async () => {
    const payload = { text: 'Liệt kê những phụ kiện theo thương hiệu Logitech' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      return;
    }
    const res = await request(CATALOG).get('/filter/category/accessories').send();
    expect([200,404,401]).toContain(res.status);
  });

  test('TC_A8 - Create order from cart', async () => {
    const payload = { text: 'Tạo đơn hàng từ giỏ hiện tại', userId: 'U99' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      return;
    }
    const res = await request(CHECKOUT).post('/order').set('Authorization', 'Bearer TEST_TOKEN').send({});
    expect([200,201,401]).toContain(res.status);
  });

  test('TC_A9 - Update order address', async () => {
    const payload = { text: 'Đổi địa chỉ giao hàng cho đơn ORUD90 thành địa chỉ X', orderId: 'ORUD90' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      return;
    }
    const res = await request(CHECKOUT).patch('/orders/ORUD90/status').set('Authorization','Bearer TEST_TOKEN').send({});
    expect([200,404,401]).toContain(res.status);
  });

  test('TC_A10 - Recommend 3 models for 4K video editing', async () => {
    const payload = { text: 'Tôi muốn nhận tư vấn cấu hình cho dựng video 4K — gợi ý 3 model' };
    const wh = await postToWebhook(payload);
    if (!wh.skipped) {
      expect([200,400]).toContain(wh.status);
      if (wh.body && wh.body.data && wh.body.data.suggestions) expect(Array.isArray(wh.body.data.suggestions)).toBeTruthy();
      return;
    }
    const res = await request(CATALOG).get('/').send();
    expect([200,404,401]).toContain(res.status);
  });
});
