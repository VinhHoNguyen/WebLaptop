const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const buildLimiter = ({ windowMs, max, name }) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn('gateway_rate_limited', {
      requestId: req.requestId,
      path: req.originalUrl,
      limiter: name,
      remoteIp: req.ip,
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      errorCode: 'RATE_LIMITED',
    });
  },
});

module.exports = {
  loginLimiter: buildLimiter({
    windowMs: 60 * 1000,
    max: 10,
    name: 'login',
  }),
  orderLimiter: buildLimiter({
    windowMs: 60 * 1000,
    max: 30,
    name: 'order',
  }),
};
