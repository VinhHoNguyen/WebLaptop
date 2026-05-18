const express = require("express");
const {getCartProducts, addCartProduct, updateCartProduct, deleteCartProduct, clearCartByUserId, checkout} = require("../controllers/cartController");
const validateToken = require('../middleware/tokenValidationMiddleware');
const internalAuth = require('../middleware/internalAuthMiddleware');

const router = express.Router();

router.delete("/internal/user/:userId", internalAuth, clearCartByUserId);

router.get("/", validateToken, getCartProducts);

router.post("/", validateToken, addCartProduct);

router.post("/:productid", validateToken, addCartProduct);

router.put("/:productid", validateToken, updateCartProduct);

router.delete("/checkout", validateToken, checkout);

router.delete("/:productid", validateToken, deleteCartProduct);


module.exports = router
