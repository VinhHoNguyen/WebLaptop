const crypto = require('crypto');
const logger = require('../utils/logger');

const correlationMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const startedAt = Date.now();
  res.on('finish', () => {
    logger.write(res.statusCode >= 500 ? 'error' : 'info', `${req.method} ${req.originalUrl}`, {
      requestId,
      userId: req.user?.id || null,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      remoteIp: req.ip,
      category: 'gateway_access',
    });
  });

  next();
};

module.exports = correlationMiddleware;
