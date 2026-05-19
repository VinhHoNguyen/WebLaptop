require('dotenv').config();
const amqp = require('amqplib');
const logger = require('./logger');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE = process.env.ORDER_EXCHANGE || 'order.events';
const EXCHANGE_DLX = `${EXCHANGE}.dlx`;
const QUEUE = process.env.QUEUE_NAME || 'order.created.notifications';
const QUEUE_DLQ = `${QUEUE}.dlq`;
const ROUTING_KEY = 'order.created';
const MAX_RETRY = Number(process.env.MAX_RETRY || 3);
const RECONNECT_DELAY_MS = 5000;

let _connection = null;
let _channel = null;
let _consumerTag = null;
let _reconnectTimer = null;
let _isShuttingDown = false;

const sendNotification = async (event, { requestId, attempt }) => {
  logger.info('notification_simulated_send', {
    requestId,
    category: 'notification',
    channel: 'email',
    to: event.email || `user-${event.userId}@example.local`,
    subject: `Don hang ${event.orderId} da duoc tao`,
    body: `Cam on quy khach, don hang ${event.orderId} tong ${event.total}d dang duoc xu ly.`,
    attempt,
  });
  if (process.env.FORCE_FAILURE === 'true') {
    throw new Error('Simulated failure for DLQ demo');
  }
};

const handleMessage = async (channel, msg) => {
  if (!msg) return;
  const requestId = msg.properties.headers?.['x-request-id'] || null;
  const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;

  let event;
  try {
    event = JSON.parse(msg.content.toString());
  } catch (err) {
    logger.error('message_parse_failed', { requestId, category: 'messaging', message: err.message });
    channel.nack(msg, false, false);
    return;
  }

  logger.info('event_received', {
    requestId,
    category: 'messaging',
    routingKey: msg.fields.routingKey,
    orderId: event.orderId,
    attempt: retryCount,
  });

  try {
    await sendNotification(event, { requestId, attempt: retryCount });
    channel.ack(msg);
    logger.info('event_processed', { requestId, category: 'messaging', orderId: event.orderId });
  } catch (err) {
    logger.error('event_processing_failed', {
      requestId,
      category: 'messaging',
      orderId: event.orderId,
      attempt: retryCount,
      message: err.message,
    });

    if (retryCount >= MAX_RETRY) {
      logger.error('event_sent_to_dlq', { requestId, category: 'messaging', orderId: event.orderId });
      channel.nack(msg, false, false);
    } else {
      channel.publish(EXCHANGE, ROUTING_KEY, msg.content, {
        persistent: true,
        contentType: 'application/json',
        headers: { ...msg.properties.headers, 'x-retry-count': retryCount },
      });
      channel.ack(msg);
    }
  }
};

const start = async () => {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    _connection = conn;

    conn.on('close', () => {
      _connection = null;
      _channel = null;
      if (!_isShuttingDown) {
        logger.warn('rabbitmq_connection_closed', { category: 'messaging' });
        _reconnectTimer = setTimeout(start, RECONNECT_DELAY_MS);
      }
    });
    conn.on('error', (err) => {
      logger.error('rabbitmq_connection_error', { category: 'messaging', message: err.message });
    });

    const channel = await conn.createChannel();
    _channel = channel;
    await channel.prefetch(10);

    await channel.assertExchange(EXCHANGE_DLX, 'fanout', { durable: true });
    await channel.assertQueue(QUEUE_DLQ, { durable: true });
    await channel.bindQueue(QUEUE_DLQ, EXCHANGE_DLX, '');

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(QUEUE, { durable: true, deadLetterExchange: EXCHANGE_DLX });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    logger.info('worker_started', { category: 'messaging', exchange: EXCHANGE, queue: QUEUE, dlq: QUEUE_DLQ });

    const { consumerTag } = await channel.consume(QUEUE, (msg) => handleMessage(channel, msg), { noAck: false });
    _consumerTag = consumerTag;
  } catch (err) {
    if (!_isShuttingDown) {
      logger.error('worker_start_failed', { category: 'messaging', message: err.message });
      _reconnectTimer = setTimeout(start, RECONNECT_DELAY_MS);
    }
  }
};

const shutdown = async (signal) => {
  _isShuttingDown = true;
  if (_reconnectTimer) clearTimeout(_reconnectTimer);
  logger.info('shutdown_initiated', { signal, category: 'messaging' });
  try {
    if (_channel && _consumerTag) await _channel.cancel(_consumerTag);
    if (_connection) await _connection.close();
  } catch (_) {}
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
