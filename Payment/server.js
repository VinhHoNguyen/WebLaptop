require('dotenv').config();
require('./config/db_conn');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const cors = require("cors");

// Khởi tạo paypal
var paypal = require('paypal-rest-sdk');

// const io = require('socket.io')(http);

var upload = require('express-fileupload');
const port = process.env.PORT || 3004

const OrderAPI = require('./routes/order.router')
const Detail_OrderAPI = require('./routes/detail_order.router')
const NoteAPI = require('./routes/note.router')


app.use('/', express.static('public'))
app.use(upload({
    useTempFiles: false,  // Tắt tạo file tạm
    limits: { fileSize: 50 * 1024 * 1024 }, // Giới hạn 50MB
}));

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

app.use('/img', express.static('public/img'));

// Cài đặt config cho paypal
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
app.use('/api/Note', NoteAPI)
app.use('/api/DetailOrder', Detail_OrderAPI)


io.on("connection", (socket) => {
  console.log(`Có người vừa kết nối, socketID: ${socket.id}`);


  socket.on('send_order', (data) => {
    console.log(data)

    socket.broadcast.emit("receive_order", data);
  })
})

app.get('/', (req, res) => {
  res.send('Welcome to the Shopping App API!');
});

http.listen(port, () => {
  console.log('listening on *: ' + port);
});


