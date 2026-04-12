const CartModel = require('../models/cartModel');
const ProductModel = require('../models/productModel');

const normalizeCount = (value) => {
    const count = Number(value);
    if (!Number.isFinite(count) || count < 1) {
        return 1;
    }
    return Math.floor(count);
};

const getCartProducts = async (req, res) => {
    const cartProducts = await CartModel.find({ UserId: req.user.id });
    const cartProductIds = [];
    const quantityById = new Map();
    let total = 0;

    cartProducts.forEach(cartProduct => {
        const productId = String(cartProduct.ProductId);
        const quantity = normalizeCount(cartProduct.quantity);
        cartProductIds.push(cartProduct.ProductId);
        quantityById.set(productId, (quantityById.get(productId) || 0) + quantity);
    });

    const Products = await ProductModel.find({ _id: { $in: cartProductIds } });
    const enrichedProducts = Products.map(product => {
        const productId = String(product._id);
        const count = quantityById.get(productId) || 1;
        total += Number(product.price || 0) * count;
        return { ...product.toObject(), count };
    });

    res.json({ Products: enrichedProducts, total });
}
const addCartProduct = async (req, res) => {
    const filter = {
        UserId: req.user.id,
        ProductId: req.params.productid
    };
    const count = normalizeCount(req.body?.count);
    const cartProduct = await CartModel.findOneAndUpdate(
        filter,
        {
            $setOnInsert: filter,
            $inc: { quantity: count }
        },
        { new: true, upsert: true }
    );
    res.json(cartProduct);
}

const updateCartProduct = async (req, res) => {
    const rawCount = Number(req.body?.count);
    if (!Number.isFinite(rawCount)) {
        return res.status(400).json({ message: "count is required" });
    }

    if (rawCount <= 0) {
        const removed = await CartModel.findOneAndDelete({
            UserId: req.user.id,
            ProductId: req.params.productid
        });
        return res.json({ removed: true, cartProduct: removed });
    }

    const count = Math.floor(rawCount);
    const cartProduct = await CartModel.findOneAndUpdate(
        {
            UserId: req.user.id,
            ProductId: req.params.productid
        },
        { $set: { quantity: count } },
        { new: true }
    );

    if (!cartProduct) {
        return res.status(404).json({ message: "Cart item not found" });
    }

    return res.json(cartProduct);
}

const deleteCartProduct = async (req, res) => {
    const cartProduct = await CartModel.findOneAndDelete(
        {
            UserId: req.user.id,
            ProductId: req.params.productid
        }
    );
    res.json(cartProduct);  
}

const checkout = async (req, res) => {
    const cartProducts = await CartModel.deleteMany({ UserId: req.user.id });
    // console.log(cartProducts);
    let total = 0;
    res.json({cartProducts});

}

module.exports = {
    getCartProducts,
    addCartProduct,
    updateCartProduct,
    deleteCartProduct,
    checkout
}