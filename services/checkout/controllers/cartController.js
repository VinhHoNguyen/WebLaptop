const {
    getCartItemsByUserId,
    upsertCartItem,
    setCartQuantity,
    removeCartItem,
    decrementOrDeleteCartItem,
    clearCart,
} = require('../repositories/cartRepository');
const { getProductsByIds, getProductById } = require('../services/productClient');
const { sendSuccess, sendError } = require('../utils/response');

const normalizeCount = (value) => {
    const count = Number(value);
    if (!Number.isFinite(count) || count < 1) {
        return 1;
    }
    return Math.floor(count);
};

const getCartProducts = async (req, res) => {
    try {
        const cartProducts = await getCartItemsByUserId(req.user.id);
        const cartProductIds = [];
        const quantityById = new Map();
        let total = 0;

        cartProducts.forEach((cartProduct) => {
            const productId = String(cartProduct.productId);
            const quantity = normalizeCount(cartProduct.quantity);
            cartProductIds.push(productId);
            quantityById.set(productId, (quantityById.get(productId) || 0) + quantity);
        });

        const products = await getProductsByIds(cartProductIds);
        const enrichedProducts = products.map((product) => {
            const productId = String(product._id);
            const count = quantityById.get(productId) || 1;
            total += Number(product.price || 0) * count;
            return { ...product, count };
        });

        return sendSuccess(res, req, {
            data: {
                products: enrichedProducts,
                total,
            },
            message: 'Cart fetched',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 502,
            message: 'Failed to fetch cart or product data',
            errorCode: 'CART_FETCH_FAILED',
        });
    }
}

const addCartProduct = async (req, res) => {
    try {
        const productId = req.params.productid || req.body?.productId;
        if (!productId) {
            return sendError(res, req, {
                status: 400,
                message: 'productId is required',
                errorCode: 'VALIDATION_ERROR',
            });
        }

        await getProductById(productId);

        const count = normalizeCount(req.body?.count);
        const cartProduct = await upsertCartItem(req.user.id, productId, count);

        return sendSuccess(res, req, {
            data: cartProduct,
            message: 'Cart item added',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 502,
            message: 'Failed to add cart item due to product service error',
            errorCode: 'PRODUCT_SERVICE_UNAVAILABLE',
        });
    }
}

const updateCartProduct = async (req, res) => {
    const rawCount = Number(req.body?.count);
    if (!Number.isFinite(rawCount)) {
        return sendError(res, req, {
            status: 400,
            message: 'count is required',
            errorCode: 'VALIDATION_ERROR',
        });
    }

    if (rawCount <= 0) {
        const removed = await removeCartItem(req.user.id, req.params.productid);
        return sendSuccess(res, req, {
            data: { removed },
            message: 'Cart item removed',
        });
    }

    const count = Math.floor(rawCount);
    const updated = await setCartQuantity(req.user.id, req.params.productid, count);

    if (!updated) {
        return sendError(res, req, {
            status: 404,
            message: 'Cart item not found',
            errorCode: 'CART_ITEM_NOT_FOUND',
        });
    }

    return sendSuccess(res, req, {
        data: { userId: req.user.id, productId: req.params.productid, quantity: count },
        message: 'Cart item updated',
    });
}

const deleteCartProduct = async (req, res) => {
    try {
        const { productid } = req.params;

        const cartItem = await decrementOrDeleteCartItem(req.user.id, productid);

        if (!cartItem) {
            return sendError(res, req, {
                status: 404,
                message: 'Cart item not found',
                errorCode: 'CART_ITEM_NOT_FOUND',
            });
        }

        return sendSuccess(res, req, {
            data: cartItem,
            message: 'Cart item deleted',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to remove product from cart',
            errorCode: 'CART_DELETE_FAILED',
        });
    }
}

const checkout = async (req, res) => {
    try {
        const deletedCount = await clearCart(req.user.id);
        return sendSuccess(res, req, {
            data: { deletedCount },
            message: 'Checkout completed',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Checkout failed',
            errorCode: 'CHECKOUT_FAILED',
        });
    }

}

module.exports = {
    getCartProducts,
    addCartProduct,
    updateCartProduct,
    deleteCartProduct,
    checkout
}