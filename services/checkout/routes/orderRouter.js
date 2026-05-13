var express = require('express')

var router = express.Router()

const Order = require('../controllers/orderController')

router.get('/order/:id', Order.get_order)
router.get('/orders', Order.get_order)

router.get('/order/detail/:id', Order.get_detail)

router.post('/order', Order.post_order)
router.post('/orders', Order.post_order)

router.patch('/orders/:id/status', Order.update_order_status)

router.post('/momo/create', Order.create_momo_payment)
router.post('/payment/momo/create', Order.create_momo_payment)

module.exports = router