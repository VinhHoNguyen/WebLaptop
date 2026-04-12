var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
        id_user: {
            type: String,
        },
        id_payment: {
            type: String,
        },
        address: String,
        total: Number,
        status: String,
        pay: Boolean,
        feeship: Number,
        id_coupon: String,
        create_time: String
    }
);

var Order = mongoose.model('Order', schema, 'order');

module.exports = Order;