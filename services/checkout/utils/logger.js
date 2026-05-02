const service = process.env.SERVICE_NAME || 'checkout-service';

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

const businessLog = (message, meta = {}) => write('info', message, { ...meta, category: 'business' });
const paymentLog = (message, meta = {}) => write('info', message, { ...meta, category: 'payment' });
const paymentError = (message, meta = {}) => write('error', message, { ...meta, category: 'payment_error' });

module.exports = {
  write,
  businessLog,
  paymentLog,
  paymentError,
};