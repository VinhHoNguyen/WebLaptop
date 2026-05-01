const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const {categoryFilter,priceFilter, categorypriceFilter} = require("../controllers/filterController")

router.get('/', productController.getProducts)
router.get("/category/:category", categoryFilter)
router.get("/price/:price", priceFilter)
router.get("/categoryprice/:category&&:price",  categorypriceFilter)


module.exports = router