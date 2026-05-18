const service = process.env.SERVICE_NAME || 'api-gateway';

const write = (level, message, meta = {}) => {
  const record = {
    ts: new Date().toISOString(),
    level,
    service,
    requestId: meta.requestId || null,
    userId: meta.userId || null,
    message,
    ...meta,
  };
  console.log(JSON.stringify(record));
};

module.exports = {
  write,
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};
