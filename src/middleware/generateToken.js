const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET_KEY || "your_jwt_secret_key";

/**
 * জেনেরিক টোকেন জেনারেটর
 * @param {Object} payload - টোকেনে যে ডাটা রাখতে চান (যেমন: { userId, role })
 * @param {String} expiresIn - টোকেনের মেয়াদ (ডিফল্ট ১ ঘণ্টা, রিসেট টোকেনের জন্য '15m' দিতে পারেন)
 */
const generateToken = (payload, expiresIn = "1h") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = generateToken;