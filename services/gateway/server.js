const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const express = require('express');
const cors = require('cors');

const correlationMiddleware = require('./middleware/correlation');
const authMiddleware = require('./middleware/auth');
const { loginLimiter, orderLimiter } = require('./middleware/rateLimit');
const { identityProxy, catalogProxy, checkoutProxy } = require('./proxy');
const logger = require('./utils/logger');

const app = express();
const port = Number(process.env.GATEWAY_PORT || 8080);
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.set('trust proxy', 1);

app.use(
  cors(
    corsOrigin === '*'
      ? undefined
      : {
          origin: corsOrigin.split(',').map((item) => item.trim()),
          credentials: true,
        }
  )
);

app.use(correlationMiddleware);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { service: 'api-gateway', status: 'UP' },
    message: 'Health check passed',
    requestId: req.requestId,
  });
});

app.post('/api/identity/login', loginLimiter);
app.post('/api/identity/users/login', loginLimiter);

app.use(authMiddleware);

app.post('/api/checkout/order', orderLimiter);
app.post('/api/checkout/orders', orderLimiter);

app.use('/api/identity', identityProxy);
app.use('/api/catalog', catalogProxy);
app.use('/api/checkout', checkoutProxy);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found at gateway`,
    errorCode: 'NOT_FOUND',
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info('gateway_started', { port });
    console.log(`API Gateway listening on port ${port}`);
  });
}

module.exports = app;
