const express = require('express');
const productController = require('../controllers/productController');
const internalAuth = require('../middleware/internalAuthMiddleware');
const requireAdmin = require('../middleware/requireAdminMiddleware');
const router = express.Router();

router.get('/internal/batch', internalAuth, productController.getInternalProductsBatch);
router.get('/internal/:id', internalAuth, productController.getInternalProductById);
router.patch('/internal/:id/stock', internalAuth, productController.patchInternalStock);

router.get('/', productController.getProducts);

router.get('/rag/context', productController.getRagContext);

router.get('/id/:id', productController.getProductById);

router.get('/:idOrName', productController.findProduct);

router.post('/', requireAdmin, productController.createProduct);

router.put('/:id', requireAdmin, productController.updateProduct);

router.post('/:id/decrement-stock', productController.decrementStock);

router.delete('/:id', requireAdmin, productController.deleteProduct);

module.exports = router;
