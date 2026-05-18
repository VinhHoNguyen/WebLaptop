const {
    createOrder,
    getOrdersByUserId,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
} = require('../repositories/orderRepository')
const { sendSuccess, sendError } = require('../utils/response')
const logger = require('../utils/logger')
const { publish } = require('../messaging/publisher')
const { getUserById } = require('../services/userClient')

module.exports.post_order = async (req, res) => {
    try {
        const payload = { ...req.body }

        const targetUserId = payload.id_user || req.user?.id
        if (targetUserId && (!payload.address || !payload.email)) {
            try {
                const userInfo = await getUserById(targetUserId)
                if (userInfo) {
                    payload.id_user = payload.id_user || userInfo.id
                    if (!payload.address) {
                        const addressParts = [userInfo.address, userInfo.phone].filter(Boolean)
                        payload.address = addressParts.join(' - ') || payload.address
                    }
                    if (!payload.email) {
                        payload.email = userInfo.email
                    }
                }
            } catch (lookupError) {
                logger.write('warn', 'order_user_lookup_failed', {
                    requestId: req.requestId,
                    userId: targetUserId,
                    message: lookupError.message,
                })
            }
        }

        const order = await createOrder(payload)

        const io = req.app.get('io')
        if (io) {
            io.emit('order:new', {
                orderId: order.id,
                total: order.total,
                status: order.status,
            })
        }

        logger.businessLog('order_created', {
            requestId: req.requestId,
            orderId: String(order.id),
            userId: order.id_user,
            total: order.total,
        })

        publish('order.created', {
            orderId: order.id,
            userId: order.id_user,
            total: order.total,
            address: order.address,
            email: req.user?.email || null,
            createdAt: order.createdAt || new Date().toISOString(),
        }, { requestId: req.requestId })

        return sendSuccess(res, req, {
            status: 201,
            data: order,
            message: 'Order created',
        })
    } catch (error) {
        logger.write('error', 'order_create_failed', {
            requestId: req.requestId,
            message: error.message,
        })
        return sendError(res, req, {
            status: 500,
            message: 'Failed to create order',
            errorCode: 'ORDER_CREATE_FAILED',
        })
    }

}

module.exports.get_order = async (req, res) => {
    try {
        const id_user = req.params.id || req.query.userId

        const order = id_user ? await getOrdersByUserId(id_user) : await getAllOrders()

        return sendSuccess(res, req, {
            data: order,
            message: 'Orders fetched',
        })
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to fetch orders',
            errorCode: 'ORDER_FETCH_FAILED',
        })
    }


}

module.exports.get_detail = async (req, res) => {
    try {
        const id_order = req.params.id

        const order = await getOrderById(id_order)

        if (!order) {
            return sendError(res, req, {
                status: 404,
                message: 'Order not found',
                errorCode: 'ORDER_NOT_FOUND',
            })
        }

        return sendSuccess(res, req, {
            data: order,
            message: 'Order detail fetched',
        })
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to fetch order detail',
            errorCode: 'ORDER_FETCH_FAILED',
        })
    }


}

module.exports.update_order_status = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const ALLOWED_STATUSES = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled']
        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return sendError(res, req, {
                status: 400,
                message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
                errorCode: 'INVALID_STATUS',
            })
        }

        const order = await updateOrderStatus(id, status)
        if (!order) {
            return sendError(res, req, {
                status: 404,
                message: 'Order not found',
                errorCode: 'ORDER_NOT_FOUND',
            })
        }

        return sendSuccess(res, req, {
            data: order,
            message: 'Order status updated',
        })
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to update order status',
            errorCode: 'ORDER_UPDATE_FAILED',
        })
    }
}

module.exports.create_momo_payment = async (req, res) => {
    const crypto = require('crypto')
    const https = require('https')

    try {
        const { orderID, total } = req.body

        logger.paymentLog('momo_payment_requested', {
            requestId: req.requestId,
            orderID,
            total,
        })

        if (!orderID || !total) {
            return res.status(400).json({ 
                resultCode: -1, 
                message: 'Missing orderID or total' 
            })
        }

        const accessKey = process.env.MOMO_ACCESS_KEY
        const secretKey = process.env.MOMO_SECRET_KEY
        const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO'
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        const redirectUrl = process.env.MOMO_REDIRECT_URL || `${frontendUrl}/momo`
        const ipnUrl = process.env.MOMO_IPN_URL || 'https://webhook.site/replace-with-your-ipn'
        const requestType = 'payWithMethod'
        const amount = total.toString()
        const orderId = partnerCode + new Date().getTime()
        const requestId = orderId
        const extraData = ''
        const orderInfo = 'Thanh toan don hang ' + orderID
        const autoCapture = true
        const lang = 'vi'

        if (!accessKey || !secretKey) {
            return res.status(500).json({
                resultCode: -1,
                message: 'Missing MOMO_ACCESS_KEY or MOMO_SECRET_KEY in env'
            })
        }

        const rawSignature = "accessKey=" + accessKey 
            + "&amount=" + amount 
            + "&extraData=" + extraData 
            + "&ipnUrl=" + ipnUrl 
            + "&orderId=" + orderId 
            + "&orderInfo=" + orderInfo 
            + "&partnerCode=" + partnerCode 
            + "&redirectUrl=" + redirectUrl 
            + "&requestId=" + requestId 
            + "&requestType=" + requestType

        logger.paymentLog('momo_raw_signature_generated', {
            requestId: req.requestId,
        })

        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex')

        logger.paymentLog('momo_signature_generated', {
            requestId: req.requestId,
        })

        const requestBody = JSON.stringify({
            partnerCode: partnerCode,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            lang: lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData: extraData,
            orderGroupId: '',
            signature: signature
        })

        logger.paymentLog('momo_request_dispatched', {
            requestId: req.requestId,
        })

        const options = {
            hostname: process.env.MOMO_HOSTNAME || 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        }

        const momoRequest = https.request(options, (momoRes) => {
            let data = ''
            
            momoRes.on('data', (chunk) => {
                data += chunk
            })

            momoRes.on('end', () => {
                try {
                    const result = JSON.parse(data)
                    logger.paymentLog('momo_response_received', {
                        requestId: req.requestId,
                        resultCode: result.resultCode,
                    })
                    res.json(result)
                } catch (error) {
                    logger.paymentError('momo_parse_error', {
                        requestId: req.requestId,
                        message: error.message,
                    })
                    res.status(500).json({ 
                        resultCode: -1,
                        error: 'Parse error', 
                        message: error.message 
                    })
                }
            })
        })

        momoRequest.on('error', (error) => {
            logger.paymentError('momo_request_error', {
                requestId: req.requestId,
                message: error.message,
            })
            res.status(500).json({ 
                resultCode: -1,
                error: 'Request failed', 
                message: error.message 
            })
        })

        momoRequest.write(requestBody)
        momoRequest.end()

    } catch (error) {
        logger.paymentError('momo_server_error', {
            requestId: req.requestId,
            message: error.message,
        })
        res.status(500).json({ 
            resultCode: -1,
            error: 'Server error', 
            message: error.message 
        })
    }
}