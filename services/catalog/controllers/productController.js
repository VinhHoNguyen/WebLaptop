const crypto = require('crypto');
const pool = require('../config/db_conn');
const { sendSuccess, sendError } = require('../utils/response');

const parseIds = (value = '') => {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

const normalizeProduct = (row) => {
    if (!row) {
        return null;
    }

    let specs = row.specs;
    if (typeof specs === 'string' && specs.length > 0) {
        try {
            specs = JSON.parse(specs);
        } catch (_error) {
            specs = null;
        }
    }

    return {
        id: row.id,
        _id: row.id,
        name: row.name,
        price: Number(row.price || 0),
        description: row.description,
        category: row.category,
        image: row.image,
        stock: row.stock,
        specs: specs || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
};

const buildQuery = (queryParams = {}) => {
    const clauses = [];
    const values = [];

    if (queryParams.ids) {
        const ids = parseIds(queryParams.ids);
        if (ids.length > 0) {
            clauses.push(`id IN (${ids.map(() => '?').join(', ')})`);
            values.push(...ids);
        }
    }

    const normalizedCategory = String(queryParams.category || '').trim();
    if (normalizedCategory && normalizedCategory.toLowerCase() !== 'all') {
        clauses.push(`LOWER(category) = LOWER(?)`);
        values.push(normalizedCategory);
    }

    const minPrice = Number(queryParams.minPrice);
    const maxPrice = Number(queryParams.maxPrice ?? queryParams.price);
    if (Number.isFinite(minPrice)) {
        clauses.push(`price >= ?`);
        values.push(minPrice);
    }
    if (Number.isFinite(maxPrice)) {
        clauses.push(`price <= ?`);
        values.push(maxPrice);
    }

    if (queryParams.keyword) {
        const keyword = `%${String(queryParams.keyword).trim()}%`;
        clauses.push(`(name LIKE ? OR category LIKE ? OR description LIKE ?)`);
        values.push(keyword, keyword, keyword);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values };
};

const getProducts = async (req, res) => {
    try {
        const { where, values } = buildQuery(req.query);
        const [rows] = await pool.query(
            `SELECT id, name, price, description, category, image, stock, specs, createdAt, updatedAt
             FROM products
             ${where}
             ORDER BY createdAt DESC`,
            values
        );

        return sendSuccess(res, req, {
            data: rows.map(normalizeProduct),
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
        const [rows] = await pool.query(
            `SELECT id, name, price, description, category, image, stock, specs, createdAt, updatedAt
             FROM products
             WHERE name = ?`,
            [req.params.name]
        );

        return sendSuccess(res, req, {
            data: rows.map(normalizeProduct),
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
        const [rows] = await pool.query(
            `SELECT id, name, price, description, category, image, stock, specs, createdAt, updatedAt
             FROM products
             WHERE id = ?
             LIMIT 1`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return sendError(res, req, {
                status: 404,
                message: 'Product not found',
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        }

        return sendSuccess(res, req, {
            data: normalizeProduct(rows[0]),
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
        const [rows] = await pool.query(
            `SELECT id, name, price, description, category, image, stock, specs, createdAt, updatedAt
             FROM products
             WHERE id = ? OR LOWER(name) = LOWER(?)
             LIMIT 1`,
            [idOrName, idOrName]
        );

        if (rows.length === 0) {
            return sendError(res, req, {
                status: 404,
                message: 'Product not found',
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        }

        return sendSuccess(res, req, {
            data: normalizeProduct(rows[0]),
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
        const id = req.body.id || crypto.randomBytes(12).toString('hex');
        const payload = {
            id,
            name: req.body.name,
            price: req.body.price || 0,
            description: req.body.description || '',
            category: req.body.category || '',
            image: req.body.image || '',
            stock: Number.isFinite(Number(req.body.stock)) ? Number(req.body.stock) : 0,
            specs: req.body.specs ? JSON.stringify(req.body.specs) : null,
        };

        await pool.query(
            `INSERT INTO products (id, name, price, description, category, image, stock, specs)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [payload.id, payload.name, payload.price, payload.description, payload.category, payload.image, payload.stock, payload.specs]
        );

        return sendSuccess(res, req, {
            status: 201,
            data: { ...payload, specs: req.body.specs || null },
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
        const updates = [];
        const values = [];

        for (const field of ['name', 'price', 'description', 'category', 'image', 'stock']) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates.push(`${field} = ?`);
                values.push(field === 'stock' || field === 'price' ? Number(req.body[field]) : req.body[field]);
            }
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'specs')) {
            updates.push(`specs = ?`);
            values.push(req.body.specs ? JSON.stringify(req.body.specs) : null);
        }

        if (updates.length === 0) {
            return sendError(res, req, {
                status: 400,
                message: 'No updatable fields were provided',
                errorCode: 'VALIDATION_ERROR',
            });
        }

        values.push(req.params.id);
        const [result] = await pool.query(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return sendError(res, req, {
                status: 404,
                message: 'Product not found',
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        }

        const [rows] = await pool.query(
            `SELECT id, name, price, description, category, image, stock, specs, createdAt, updatedAt
             FROM products
             WHERE id = ?
             LIMIT 1`,
            [req.params.id]
        );

        return sendSuccess(res, req, {
            data: normalizeProduct(rows[0]),
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
        const [result] = await pool.query(`DELETE FROM products WHERE id = ?`, [req.params.id]);

        if (result.affectedRows === 0) {
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