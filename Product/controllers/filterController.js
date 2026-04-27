const productController = require('./productController');

const categoryFilter  = async (req, res) =>{
    req.query = {
        ...req.query,
        category: req.params.category,
    };
    return productController.getProducts(req, res);
}

const priceFilter = async (req, res) =>{  
    req.query = {
        ...req.query,
        price: req.params.price,
    };
    return productController.getProducts(req, res);
}

const  categorypriceFilter = async (req, res) =>{
    req.query = {
        ...req.query,
        category: req.params.category,
        price: req.params.price,
    };
    return productController.getProducts(req, res);
}

module.exports = {
    categoryFilter,
    priceFilter,
    categorypriceFilter
}