const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/db_conn');
const { sendSuccess, sendError } = require('../utils/response');

let productsCache = null;

// Load products from JSON file for fallback
const loadProductsFromJson = async () => {
    if (productsCache) return productsCache;
    
    const candidatePaths = [
        process.env.PRODUCTS_JSON_PATH,
        path.resolve(__dirname, '../../../products.json'),
        path.resolve(process.cwd(), 'products.json'),
    ].filter(Boolean);

    for (const filePath of candidatePaths) {
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(raw);
            productsCache = data.map(item => ({
                id: item?._id?.$oid || item.id,
                _id: item?._id?.$oid || item.id,
                name: item.name,
                price: item.price,
                description: item.description || '',
                category: item.category || '',
                image: item.image || '',
                stock: item.stock ?? 0,
                specs: typeof item.specs === 'object' ? item.specs : null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }));
            return productsCache;
        } catch (_error) {
            // Continue to next path
        }
    }
    return [];
};

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

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseBudgetFromQuery = (query = '') => {
    const normalized = String(query).toLowerCase();
    const match = normalized.match(/(\d[\d.,]*)\s*(k|nghin|ngh?n|trieu|triệu|m)?/i);
    if (!match) {
        return null;
    }

    const amount = toFiniteNumber(String(match[1]).replace(/[.,]/g, ''));
    if (amount === null) {
        return null;
    }

    const unit = (match[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'nghin' || unit === 'ngh?n') {
        return amount * 1000;
    }
    if (unit === 'm' || unit === 'trieu' || unit === 'triệu') {
        return amount * 1000000;
    }

    return amount;
};

const tokenizeQuery = (query = '') => {
    return String(query)
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((term) => term.length >= 2);
};

const scoreProductForQuery = (product, terms, budget) => {
    const specs = product?.specs || {};
    const haystack = [
        product?.name,
        product?.description,
        product?.category,
        specs.brand,
        specs.cpu,
        specs.gpu,
        specs.display,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const termScore = terms.reduce((score, term) => {
        return score + (haystack.includes(term) ? 1 : 0);
    }, 0);

    const stockScore = Number(product?.stock || 0) > 0 ? 0.5 : 0;
    const priceValue = toFiniteNumber(product?.price);
    const budgetScore = budget !== null && priceValue !== null
        ? Math.max(0, 3 - (Math.abs(priceValue - budget) / Math.max(budget, 1)))
        : 0;

    return termScore + stockScore + budgetScore;
};

const selectRelevantProducts = (products, query, limit = 8) => {
    const terms = tokenizeQuery(query);
    const budget = parseBudgetFromQuery(query);

    return products
        .map((product) => ({
            product,
            score: scoreProductForQuery(product, terms, budget),
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
        .map((item) => item.product);
};

const buildRagContext = (products, query, limit = 8) => {
    const relevantProducts = selectRelevantProducts(products, query, limit);
    const prices = products
        .map((product) => toFiniteNumber(product.price))
        .filter((value) => value !== null);

    return {
        totalProducts: products.length,
        availableProducts: products.filter((product) => Number(product.stock || 0) > 0).length,
        categories: Array.from(new Set(products.map((product) => product.category).filter(Boolean))).slice(0, 15),
        priceRange: prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
        relevantProducts,
    };
};

const getRagContext = async (req, res) => {
    const query = String(req.query.q || req.query.message || '').trim();
    const limit = Math.max(1, Math.min(Number(req.query.k) || 8, 20));

    if (!query) {
        return sendError(res, req, {
            status: 400,
            message: 'Missing query. Use ?q=your question',
            errorCode: 'VALIDATION_ERROR',
        });
    }

    try {
        const [rows] = await pool.query(
            `SELECT id, name, price, description, category, image, stock, specs, createdAt, updatedAt
             FROM products
             ORDER BY updatedAt DESC
             LIMIT 500`
        );

        const products = rows.map(normalizeProduct);
        return sendSuccess(res, req, {
            data: buildRagContext(products, query, limit),
            message: 'RAG context generated',
        });
    } catch (_error) {
        try {
            const products = await loadProductsFromJson();
            return sendSuccess(res, req, {
                data: buildRagContext(products, query, limit),
                message: 'RAG context generated from cache',
            });
        } catch (_fallbackError) {
            return sendError(res, req, {
                status: 500,
                message: 'Failed to generate RAG context',
                errorCode: 'RAG_CONTEXT_FAILED',
            });
        }
    }
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
        // Fallback to products.json
        try {
            let products = await loadProductsFromJson();

            // Apply filters
            if (req.query.ids) {
                const requestedIds = new Set(parseIds(req.query.ids));
                if (requestedIds.size === 0) {
                    products = [];
                } else {
                    products = products.filter(p => requestedIds.has(String(p.id)));
                }
            }
            if (req.query.category && req.query.category.toLowerCase() !== 'all') {
                products = products.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
            }
            if (req.query.keyword) {
                const keyword = req.query.keyword.toLowerCase();
                products = products.filter(p => 
                    p.name.toLowerCase().includes(keyword) || 
                    p.category.toLowerCase().includes(keyword) ||
                    p.description.toLowerCase().includes(keyword)
                );
            }
            if (req.query.minPrice) {
                products = products.filter(p => p.price >= Number(req.query.minPrice));
            }
            if (req.query.maxPrice || req.query.price) {
                const maxPrice = Number(req.query.maxPrice ?? req.query.price);
                products = products.filter(p => p.price <= maxPrice);
            }
            
            return sendSuccess(res, req, {
                data: products,
                message: 'Products fetched from cache',
            });
        } catch (fallbackError) {
            return sendError(res, req, {
                status: 500,
                message: 'Failed to fetch products',
                errorCode: 'PRODUCT_FETCH_FAILED',
            });
        }
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
        // Fallback to products.json
        try {
            const products = await loadProductsFromJson();
            const data = products.filter(p => p.name === req.params.name);
            return sendSuccess(res, req, {
                data,
                message: 'Products fetched by name from cache',
            });
        } catch (fallbackError) {
            return sendError(res, req, {
                status: 500,
                message: 'Failed to fetch product by name',
                errorCode: 'PRODUCT_FETCH_FAILED',
            });
        }
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
        // Fallback to products.json
        try {
            const products = await loadProductsFromJson();
            const product = products.find(p => p.id === req.params.id);
            
            if (!product) {
                return sendError(res, req, {
                    status: 404,
                    message: 'Product not found',
                    errorCode: 'PRODUCT_NOT_FOUND',
                });
            }

            return sendSuccess(res, req, {
                data: product,
                message: 'Product fetched from cache',
            });
        } catch (fallbackError) {
            return sendError(res, req, {
                status: 500,
                message: 'Failed to fetch product by id',
                errorCode: 'PRODUCT_FETCH_FAILED',
            });
        }
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

const decrementStock = async (req, res) => {
    try {
        const productId = String(req.params.id || '').trim();
        const count = Number(req.body?.count);
        if (!productId || !Number.isFinite(count) || count <= 0) {
            return sendError(res, req, {
                status: 400,
                message: 'Valid productId and positive count are required',
                errorCode: 'VALIDATION_ERROR',
            });
        }

        const [result] = await pool.query(
            `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
            [Math.floor(count), productId, Math.floor(count)]
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.query(
                `SELECT id, stock FROM products WHERE id = ? LIMIT 1`,
                [productId]
            );
            if (existing.length === 0) {
                return sendError(res, req, {
                    status: 404,
                    message: 'Product not found',
                    errorCode: 'PRODUCT_NOT_FOUND',
                });
            }
            return sendError(res, req, {
                status: 409,
                message: 'Insufficient stock',
                errorCode: 'INSUFFICIENT_STOCK',
                data: { available: Number(existing[0].stock || 0), requested: Math.floor(count) },
            });
        }

        const [rows] = await pool.query(
            `SELECT id, name, price, description, category, image, stock, specs, createdAt, updatedAt
             FROM products
             WHERE id = ?
             LIMIT 1`,
            [productId]
        );

        return sendSuccess(res, req, {
            data: normalizeProduct(rows[0]),
            message: 'Stock decremented',
        });
    } catch (error) {
        return sendError(res, req, {
            status: 500,
            message: 'Failed to decrement stock',
            errorCode: 'STOCK_UPDATE_FAILED',
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
    getRagContext,
    getProductByName,
    createProduct,
    getProductById,
    findProduct,
    updateProduct,
    decrementStock,
    deleteProduct
};