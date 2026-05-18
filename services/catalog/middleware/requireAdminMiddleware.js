const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');
const { getUserRole } = require('../services/userClient');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const extractUserId = (req) => {
  if (req.headers['x-user-id']) {
    return {
      id: String(req.headers['x-user-id']),
      role: req.headers['x-user-role'] || null,
    };
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], ACCESS_TOKEN);
    return decoded?.user ? { id: decoded.user.id, role: decoded.user.role || null } : null;
  } catch (_error) {
    return null;
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const identity = extractUserId(req);
    if (!identity?.id) {
      return sendError(res, req, {
        status: 401,
        message: 'Authentication required',
        errorCode: 'UNAUTHORIZED',
      });
    }

    const data = await getUserRole(identity.id);
    const role = data?.role || identity.role;

    if (String(role || '').toLowerCase() !== 'admin') {
      return sendError(res, req, {
        status: 403,
        message: 'Admin role required',
        errorCode: 'FORBIDDEN',
      });
    }

    req.user = { id: identity.id, role };
    return next();
  } catch (error) {
    return sendError(res, req, {
      status: 502,
      message: 'Failed to verify admin role with identity service',
      errorCode: 'IDENTITY_SERVICE_UNAVAILABLE',
    });
  }
};

module.exports = requireAdmin;
