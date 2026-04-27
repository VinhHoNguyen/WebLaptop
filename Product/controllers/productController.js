const productModel = require('../models/productModel');
const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../utils/response');

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseIds = (value = '') => {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

const buildQuery = (queryParams = {}) => {
    const query = {};

    if (queryParams.ids) {
        const ids = parseIds(queryParams.ids);
        const invalid = ids.find((id) => !mongoose.Types.ObjectId.isValid(id));
        if (invalid) {
            return {
                error: {
                    status: 400,
                    message: `Invalid product id: ${invalid}`,
                    errorCode: 'INVALID_PRODUCT_ID',
                },
            };
        }
        query._id = { $in: ids };
    }

    const normalizedCategory = String(queryParams.category || '').trim();
    if (normalizedCategory && normalizedCategory.toLowerCase() !== 'all') {
        query.category = new RegExp(`^${escapeRegExp(normalizedCategory)}$`, 'i');
    }

    const minPrice = Number(queryParams.minPrice);
    const maxPrice = Number(queryParams.maxPrice ?? queryParams.price);
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
        query.price = {};
        if (Number.isFinite(minPrice)) {
            query.price.$gte = minPrice;
        }
        if (Number.isFinite(maxPrice)) {
            query.price.$lte = maxPrice;
        }
    }

    if (queryParams.keyword) {
        const keywordRegex = new RegExp(escapeRegExp(queryParams.keyword), 'i');
        query.$or = [
            { name: keywordRegex },
            { category: keywordRegex },
            { description: keywordRegex },
        ];
    }

    return { query };
};

const getProducts = async (req, res) => {
    try {
        const { query, error } = buildQuery(req.query);
        if (error) {
            return sendError(res, req, error);
        }

        const products = await productModel.find(query).sort({ createdAt: -1 });
        return sendSuccess(res, req, {
            data: products,
            message: 'Products fetched',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to fetch products',
            errorCode: 'PRODUCT_FETCH_FAILED',
        });
    }
};

const getProductByName = async (req, res) => {
    try {
        const product = await productModel.find({ name: req.params.name });
        return sendSuccess(res, req, {
            data: product,
            message: 'Products fetched by name',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to fetch product by name',
            errorCode: 'PRODUCT_FETCH_FAILED',
        });
    }
};

const getProductById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendError(res, req, {
                status: 400,
                message: 'Invalid product id',
                errorCode: 'INVALID_PRODUCT_ID',
            });
        }
        const productDetails = await productModel.findById(req.params.id);

        if (!productDetails) {
            return sendError(res, req, {
                status: 404,
                message: 'Product not found',
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        }

        return sendSuccess(res, req, {
            data: productDetails,
            message: 'Product fetched',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to fetch product by id',
            errorCode: 'PRODUCT_FETCH_FAILED',
        });
    }
};

const findProduct = async (req, res) => {
    try {
        const { idOrName } = req.params;
        let product = null;

        if (mongoose.Types.ObjectId.isValid(idOrName)) {
            product = await productModel.findById(idOrName);
        }

        if (!product) {
            product = await productModel.findOne({
                name: new RegExp(`^${escapeRegExp(idOrName)}$`, 'i'),
            });
        }

        if (!product) {
            return sendError(res, req, {
                status: 404,
                message: 'Product not found',
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        }

        return sendSuccess(res, req, {
            data: product,
            message: 'Product fetched',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to find product',
            errorCode: 'PRODUCT_FETCH_FAILED',
        });
    }
};

const createProduct = async (req, res) => {
    try {
        const product = await productModel.create(req.body);
        return sendSuccess(res, req, {
            status: 201,
            data: product,
            message: 'Product created',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 400,
            message: 'Failed to create product',
            errorCode: 'PRODUCT_CREATE_FAILED',
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendError(res, req, {
                status: 400,
                message: 'Invalid product id',
                errorCode: 'INVALID_PRODUCT_ID',
            });
        }

        const updated = await productModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return sendError(res, req, {
                status: 404,
                message: 'Product not found',
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        }

        return sendSuccess(res, req, {
            data: updated,
            message: 'Product updated',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 400,
            message: 'Failed to update product',
            errorCode: 'PRODUCT_UPDATE_FAILED',
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendError(res, req, {
                status: 400,
                message: 'Invalid product id',
                errorCode: 'INVALID_PRODUCT_ID',
            });
        }

        const deleted = await productModel.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return sendError(res, req, {
                status: 404,
                message: 'Product not found',
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        }

        return sendSuccess(res, req, {
            data: { id: req.params.id },
            message: 'Product deleted',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 400,
            message: 'Failed to delete product',
            errorCode: 'PRODUCT_DELETE_FAILED',
        });
    }
};

module.exports = {
    getProducts,
    getProductByName,
    createProduct,
    getProductById,
    findProduct,
    updateProduct,
    deleteProduct
};
