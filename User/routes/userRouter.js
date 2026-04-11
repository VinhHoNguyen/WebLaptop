const express = require("express");
const router = express.Router();
const validateToken = require("../middleware/tokenValidationMiddleware");

const {
	getUser,
	getUsers,
	getUserById,
	updateUserById,
	deleteUserById,
	userRegister,
	loginUser,
} = require("../controllers/usercontroller");

router.route("/all").get(validateToken, getUsers);

router.route("/").post(userRegister);

router.route("/").get(validateToken, getUser);

router.route("/:id").get(validateToken, getUserById);
router.route("/:id").put(validateToken, updateUserById);
router.route("/:id").delete(validateToken, deleteUserById);

router.route("/login").post(loginUser);

module.exports = router;
