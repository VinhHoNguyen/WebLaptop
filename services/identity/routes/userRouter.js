const express = require("express");
const router = express.Router();
const validateToken = require("../middleware/tokenValidationMiddleware");
const internalAuth = require("../middleware/internalAuthMiddleware");

const {
        getUser,
        getUsers,
        getUserById,
        updateUserById,
        deleteUserById,
        userRegister,
        loginUser,
        getInternalUserById,
        getInternalUserRole,
} = require("../controllers/usercontroller");

router.route("/internal/:id/role").get(internalAuth, getInternalUserRole);
router.route("/internal/:id").get(internalAuth, getInternalUserById);

router.route("/all").get(validateToken, getUsers);

router.route("/").post(userRegister);

router.route("/").get(validateToken, getUser);

router.route("/:id").get(validateToken, getUserById);
router.route("/:id").put(validateToken, updateUserById);
router.route("/:id").delete(validateToken, deleteUserById);

router.route("/login").post(loginUser);

module.exports = router;
