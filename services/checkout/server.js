const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('./config/db_conn');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: process.env.SOCKET_ALLOWED_ORIGIN || process.env.CORS_ORIGIN || '*',
  },
});
const crypto = require('crypto');
const { sendSuccess } = require('./utils/response');
const logger = require('./utils/logger');

const cors = require("cors");

var paypal = require('paypal-rest-sdk');

var upload = require('express-fileupload');
const port = Number(process.env.CHECKOUT_PORT || process.env.PAYMENT_PORT || process.env.PORT || 3004)
const serviceName = process.env.SERVICE_NAME || 'checkout-service';
const corsOrigin = process.env.CORS_ORIGIN || '*';

const OrderAPI = require('./routes/orderRouter')
const Detail_OrderAPI = require('./routes/detailOrderRouter')
const CartAPI = require('./routes/cartRouter')


app.use('/', express.static('public'))
app.use(upload({
    useTempFiles: false,
    limits: { fileSize: 50 * 1024 * 1024 },
}));

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  cors(
    corsOrigin === '*'
      ? undefined
      : {
          origin: corsOrigin.split(',').map((item) => item.trim()),
        }
  )
);

app.use((req, res, next) => {
  const traceId = req.headers['x-request-id'] || crypto.randomUUID();
  req.traceId = traceId;
  req.requestId = traceId;
  res.setHeader('x-request-id', traceId);

  const startedAt = Date.now();
  res.on('finish', () => {
    logger.write(res.statusCode >= 500 ? 'error' : 'info', `${req.method} ${req.originalUrl}`, {
      requestId: traceId,
      userId: req.user?.id || null,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

app.get('/health', (req, res) => {
  return sendSuccess(res, req, {
    data: {
      service: serviceName,
      status: 'UP',
    },
    message: 'Health check passed',
  });
});

app.use('/img', express.static('public/img'));

const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
if (paypalClientId && paypalClientSecret) {
  paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: paypalClientId,
    client_secret: paypalClientSecret,
  });
}

app.use('/api/Payment', OrderAPI)
app.use('/api/DetailOrder', Detail_OrderAPI)
app.use('/cart', CartAPI)

app.use('/', OrderAPI)

app.set('io', io);


io.on("connection", (socket) => {
  logger.businessLog('socket_connected', { socketId: socket.id });


  socket.on('send_order', (data) => {
    logger.businessLog('socket_order_event', { payload: data })

    socket.broadcast.emit("receive_order", data);
  })
})

app.get('/', (req, res) => {
  res.send('Welcome to the Shopping App API!');
});

if (require.main === module) {
  http.listen(port, () => {
    console.log('listening on *: ' + port);
  });
}

module.exports = app;