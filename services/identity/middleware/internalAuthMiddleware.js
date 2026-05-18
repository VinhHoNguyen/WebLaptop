const { sendError } = require('../utils/response');

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'internal-shared-secret';

const internalAuth = (req, res, next) => {
  const flag = req.headers['x-internal-call'];
  const secret = req.headers['x-internal-secret'];

  if (String(flag).toLowerCase() !== 'true' || secret !== INTERNAL_SECRET) {
    return sendError(res, req, {
      status: 403,
      message: 'Internal endpoint requires service-to-service credentials',
      errorCode: 'INTERNAL_AUTH_REQUIRED',
    });
  }

  return next();
};

module.exports = internalAuth;
