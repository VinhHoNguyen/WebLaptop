const fetch = require('node-fetch');

const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 5000);
const RETRY_COUNT = Number(process.env.PRODUCT_RETRY_COUNT || 2);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (path) => {
  let lastError = null;

  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${PRODUCT_SERVICE_URL}${path}`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
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
  return requestWithRetry(`/products?ids=${query}`);
};

const getProductById = async (id) => {
  const productId = String(id || '').trim();
  if (!productId) {
    throw new Error('Missing product id');
  }
  return requestWithRetry(`/products/id/${encodeURIComponent(productId)}`);
};

module.exports = {
  getProductsByIds,
  getProductById,
};