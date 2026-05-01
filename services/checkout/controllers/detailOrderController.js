const {
    getOrderDetailsByOrderId,
    createDetailOrder,
} = require('../repositories/orderRepository')
const { sendSuccess, sendError } = require('../utils/response')

module.exports.detail = async (req, res) => {
    try {
        const id_order = req.params.id

        const detail_order = await getOrderDetailsByOrderId(id_order)

        return sendSuccess(res, req, {
            data: detail_order,
            message: 'Order details fetched',
        })
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to fetch order details',
            errorCode: 'ORDER_DETAIL_FETCH_FAILED',
        })
    }


}

module.exports.post_detail_order = async (req, res) => {
    try {
        const detail_order = await createDetailOrder(req.body)

        return sendSuccess(res, req, {
            status: 201,
            data: detail_order,
            message: 'Order detail created',
        })
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to create order detail',
            errorCode: 'ORDER_DETAIL_CREATE_FAILED',
        })
    }


}