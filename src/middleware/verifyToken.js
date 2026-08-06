const jwt = require('jsonwebtoken');
const { errorResponse } = require("../utilis/responsHandler");

const JWT_SECRET = process.env.JWT_SECRET_KEY || "your_jwt_secret_key";

const verifyToken = (req, res, next) => {
  try {
    // ১. কুকি থেকে অথবা Authorization Header থেকে টোকেন গ্রহণ
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, 401, "Token not found! Please login.");
    }

    // 🛠️ ২. টোকেন থেকে অতিরিক্ত কোটেশন বা স্পেস রিমুভ করা
    const cleanToken = typeof token === "string" ? token.replace(/"/g, "").trim() : token;

    // ৩. টোকেন ভেরিফাই করা
    const decoded = jwt.verify(cleanToken, JWT_SECRET);

    // 🛠️ ৪. userId অথবা id চেক করা (নিরাপত্তার খাতিরে)
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return errorResponse(res, 403, "User ID not found in token payload");
    }

    // ৫. রিকোয়েস্টে ইউজার ডাটা সেট করা
    req.userId = userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return errorResponse(res, 401, "Invalid token", error.message);
  }
};

module.exports = verifyToken;