var express = require('express')

var router = express.Router()

const Order = require('../controllers/order.controller')

// Hiển thị danh sách đơn đặt hàng
router.get('/order/:id', Order.get_order)

// Hiển thị chi tiết đơn đặt hàng
router.get('/order/detail/:id', Order.get_detail)

// Đặt Hàng thêm vào hóa đơn
router.post('/order', Order.post_order)

// router.post('/momo', Order.post_momo)

// API tạo thanh toán MoMo (proxy)
router.post('/momo/create', Order.create_momo_payment)

module.exports = router