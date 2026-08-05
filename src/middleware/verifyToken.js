const jwt = require('jsonwebtoken');
const { errorResponse } = require("../utilis/responsHandler"); // বানান খেয়াল রাখুন: utilis নাকি utils

const JWT_SECRET = process.env.JWT_SECRET_KEY || "your_jwt_secret_key"; // 💡 এখানেও ফলব্যাক কী-টি মিল রাখুন

const verifyToken = (req, res, next) => {
  try {
    // আপনি যেহেতু ফ্রন্টএন্ডে credentials: "include" ব্যবহার করছেন, তাই কুকি থেকে টোকেন নেওয়া একদম পারফেক্ট
    const token = req.cookies.token; 

    if (!token) {
      return errorResponse(res, 401, "Token not found! Please login.");
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return errorResponse(res, 403, "User id not found in token");
    }

    // পরবর্তী মিডলওয়্যার বা কন্ট্রোলারের ব্যবহারের জন্য রিকোয়েস্টে ডাটা সেট করা
    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    return errorResponse(res, 401, "Invalid token", error.message);
  }
};

module.exports = verifyToken;

