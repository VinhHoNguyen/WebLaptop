const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('./utils/logger');

const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'gateway-shared-secret';

const buildProxy = ({ target, prefix }) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite: { [`^${prefix}`]: '' },
  onProxyReq: (proxyReq, req) => {
    if (req.requestId) {
      proxyReq.setHeader('x-request-id', req.requestId);
    }
    proxyReq.setHeader('x-gateway-secret', GATEWAY_SECRET);
    if (req.user) {
      proxyReq.setHeader('x-user-id', String(req.user.id || ''));
      proxyReq.setHeader('x-user-role', String(req.user.role || ''));
      proxyReq.setHeader('x-user-email', String(req.user.email || ''));
    }
  },
  onError: (err, req, res) => {
    logger.error('gateway_proxy_error', {
      requestId: req.requestId,
      target,
      path: req.originalUrl,
      message: err.message,
    });
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: 'Upstream service unavailable',
        errorCode: 'BAD_GATEWAY',
      });
    }
  },
});

module.exports = {
  identityProxy: buildProxy({
    target: process.env.IDENTITY_SERVICE_URL || 'http://identity:3001',
    prefix: '/api/identity',
  }),
  catalogProxy: buildProxy({
    target: process.env.CATALOG_SERVICE_URL || 'http://catalog:3002',
    prefix: '/api/catalog',
  }),
  checkoutProxy: buildProxy({
    target: process.env.CHECKOUT_SERVICE_URL || 'http://checkout:3004',
    prefix: '/api/checkout',
  }),
};
