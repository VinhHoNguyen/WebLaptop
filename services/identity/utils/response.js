function sendSuccess(res, req, { data = null, message = "OK", status = 200 } = {}) {
  return res.status(status).json({
    success: true,
    data,
    message,
    errorCode: null,
    traceId: req.traceId || null,
  });
}

function sendError(
  res,
  req,
  {
    status = 500,
    message = "Internal server error",
    errorCode = "INTERNAL_ERROR",
    data = null,
  } = {}
) {
  return res.status(status).json({
    success: false,
    data,
    message,
    errorCode,
    traceId: req.traceId || null,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};