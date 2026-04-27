const express = require("express");
const {getCartProducts, addCartProduct, updateCartProduct, deleteCartProduct, checkout} = require("../controllers/cartController");
const validateToken = require('../middleware/tokenValidationMiddleware');

const router = express.Router();

router.get("/", validateToken, getCartProducts);

router.post("/", validateToken, addCartProduct);

router.post("/:productid", validateToken, addCartProduct);

router.put("/:productid", validateToken, updateCartProduct);

router.delete("/checkout", validateToken, checkout);

router.delete("/:productid", validateToken, deleteCartProduct);


module.exports = router