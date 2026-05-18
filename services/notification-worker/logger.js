const service = process.env.SERVICE_NAME || 'notification-worker';

const write = (level, message, meta = {}) => {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service,
    requestId: meta.requestId || null,
    message,
    ...meta,
  }));
};

module.exports = {
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};
