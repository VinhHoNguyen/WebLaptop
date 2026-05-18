const CHECKOUT_SERVICE_URL = (process.env.CHECKOUT_SERVICE_URL || 'http://localhost:3004').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 5000);
const RETRY_COUNT = Number(process.env.CHECKOUT_RETRY_COUNT || 2);
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'internal-shared-secret';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (path, options = {}) => {
  let lastError = null;
  const method = options.method || 'GET';
  const body = options.body !== undefined ? JSON.stringify(options.body) : undefined;

  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${CHECKOUT_SERVICE_URL}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-internal-call': 'true',
          'x-internal-secret': INTERNAL_SECRET,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        lastError = new Error(`Checkout service responded with ${response.status}`);
      } else {
        const payload = await response.json().catch(() => null);
        if (payload && typeof payload === 'object' && 'success' in payload) {
          if (!payload.success) {
            throw new Error(payload.message || 'Checkout service returned unsuccessful response');
          }
          return payload.data;
        }
        return payload;
      }
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
    }

    if (attempt < RETRY_COUNT) {
      await sleep(200 * (attempt + 1));
    }
  }

  throw lastError || new Error('Failed to call Checkout service');
};

const clearUserCart = async (userId) => {
  const id = String(userId || '').trim();
  if (!id) {
    throw new Error('Missing user id');
  }
  return requestWithRetry(`/cart/internal/user/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

module.exports = {
  clearUserCart,
};
