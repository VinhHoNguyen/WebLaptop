const amqp = require('amqplib');
const logger = require('../utils/logger');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE = process.env.ORDER_EXCHANGE || 'order.events';
const EXCHANGE_DLX = `${EXCHANGE}.dlx`;
const RECONNECT_DELAY_MS = 5000;

let channel = null;
let connecting = false;

const connect = async () => {
  if (channel || connecting) return;
  connecting = true;
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    conn.on('close', () => {
      logger.write('warn', 'rabbitmq_connection_closed', { category: 'messaging' });
      channel = null;
      setTimeout(connect, RECONNECT_DELAY_MS);
    });
    conn.on('error', (err) => {
      logger.write('error', 'rabbitmq_connection_error', {
        category: 'messaging',
        message: err.message,
      });
    });

    const ch = await conn.createConfirmChannel();
    await ch.assertExchange(EXCHANGE_DLX, 'fanout', { durable: true });
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

    channel = ch;
    logger.write('info', 'rabbitmq_publisher_ready', {
      category: 'messaging',
      exchange: EXCHANGE,
    });
  } catch (err) {
    logger.write('error', 'rabbitmq_connect_failed', {
      category: 'messaging',
      message: err.message,
    });
    setTimeout(connect, RECONNECT_DELAY_MS);
  } finally {
    connecting = false;
  }
};

const publish = (routingKey, payload, { requestId } = {}) => {
  if (!channel) {
    logger.write('warn', 'rabbitmq_publish_skipped_no_channel', {
      category: 'messaging',
      routingKey,
      requestId,
    });
    return false;
  }

  const message = Buffer.from(JSON.stringify(payload));
  const ok = channel.publish(EXCHANGE, routingKey, message, {
    persistent: true,
    contentType: 'application/json',
    messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    headers: { 'x-request-id': requestId || null },
  });

  logger.write('info', 'event_published', {
    category: 'messaging',
    requestId,
    routingKey,
    exchange: EXCHANGE,
    deliveredToBuffer: ok,
  });
  return ok;
};

connect();

module.exports = { publish };
