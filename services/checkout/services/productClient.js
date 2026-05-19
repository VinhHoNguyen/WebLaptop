const fetch = require('node-fetch');
const CircuitBreaker = require('../utils/circuitBreaker');

const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002').replace(/\/+$/, '');

const breaker = new CircuitBreaker('catalog-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
});
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 5000);
const RETRY_COUNT = Number(process.env.PRODUCT_RETRY_COUNT || 2);
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
      const response = await fetch(`${PRODUCT_SERVICE_URL}${path}`, {
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
        lastError = new Error(`Product service responded with ${response.status}`);
      } else {
        const payload = await response.json();
        if (payload && typeof payload === 'object' && 'success' in payload) {
          if (!payload.success) {
            throw new Error(payload.message || 'Product service returned unsuccessful response');
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

  throw lastError || new Error('Failed to call Product service');
};

const getProductsByIds = async (ids = []) => {
  const uniqueIds = Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }
  const query = encodeURIComponent(uniqueIds.join(','));
  return breaker.call(() => requestWithRetry(`/products/internal/batch?ids=${query}`));
};

const getProductById = async (id) => {
  const productId = String(id || '').trim();
  if (!productId) {
    throw new Error('Missing product id');
  }
  return breaker.call(() => requestWithRetry(`/products/internal/${encodeURIComponent(productId)}`));
};

const adjustStock = async (id, delta) => {
  const productId = String(id || '').trim();
  const intDelta = Math.trunc(Number(delta));
  if (!productId || !Number.isFinite(intDelta) || intDelta === 0) {
    throw new Error('Invalid productId or delta');
  }
  return breaker.call(() => requestWithRetry(`/products/internal/${encodeURIComponent(productId)}/stock`, {
    method: 'PATCH',
    body: { delta: intDelta },
  }));
};

const decrementStock = async (id, count) => {
  const qty = Math.floor(Number(count));
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('Invalid count');
  }
  return adjustStock(id, -qty);
};

const restoreStock = async (id, count) => {
  const qty = Math.floor(Number(count));
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('Invalid count');
  }
  return adjustStock(id, qty);
};

module.exports = {
  getProductsByIds,
  getProductById,
  adjustStock,
  decrementStock,
  restoreStock,
};
