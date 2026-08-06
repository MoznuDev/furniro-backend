const jwt = require('jsonwebtoken');
const { errorResponse } = require("../utilis/responsHandler");

const JWT_SECRET = process.env.JWT_SECRET_KEY || "your_jwt_secret_key";

const verifyToken = (req, res, next) => {
  try {
    // ১. কুকি থেকে অথবা Authorization Header থেকে টোকেন নিন
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, 401, "Token not found! Please login.");
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return errorResponse(res, 403, "User id not found in token");
    }

    // মিডলওয়্যার ও কন্ট্রোলারের জন্য ডেটা সেট
    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    return errorResponse(res, 401, "Invalid token", error.message);
  }
};

module.exports = verifyToken;