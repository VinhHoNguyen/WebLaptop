const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/response");
require("dotenv").config();

const validateToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendError(res, req, {
            status: 401,
            message: "user is not authorized",
            errorCode: "UNAUTHORIZED",
        });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err || !decoded?.user) {
            return sendError(res, req, {
                status: 401,
                message: "user is not authorized",
                errorCode: "UNAUTHORIZED",
            });
        }

        req.user = decoded.user;
        next();
    });
});

module.exports = validateToken;