const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN;

const PUBLIC_PATHS = [
  { method: 'POST', pattern: /^\/api\/identity\/login$/ },
  { method: 'POST', pattern: /^\/api\/identity\/users\/?$/ },
  { method: 'POST', pattern: /^\/api\/identity\/users\/login$/ },
  { method: 'GET',  pattern: /^\/api\/catalog\/.*/ },
  { method: 'GET',  pattern: /^\/api\/checkout\/momo\/.*/ },
  { method: 'POST', pattern: /^\/api\/checkout\/momo\/.*/ },
  { method: 'GET',  pattern: /^\/health$/ },
];

const isPublic = (req) => PUBLIC_PATHS.some(
  ({ method, pattern }) => method === req.method && pattern.test(req.path)
);

const authMiddleware = (req, res, next) => {
  if (isPublic(req)) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    logger.warn('gateway_auth_missing', {
      requestId: req.requestId,
      path: req.originalUrl,
    });
    return res.status(401).json({
      success: false,
      message: 'Missing or invalid Authorization header',
      errorCode: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.slice(7);
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err || !decoded?.user) {
      logger.warn('gateway_auth_invalid', {
        requestId: req.requestId,
        path: req.originalUrl,
        reason: err?.message,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        errorCode: 'UNAUTHORIZED',
      });
    }

    req.user = decoded.user;
    next();
  });
};

module.exports = authMiddleware;
