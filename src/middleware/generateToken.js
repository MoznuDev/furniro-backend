const jwt = require("jsonwebtoken");

// .env ফাইল না পেলেও যেন ক্র্যাশ না করে, তাই একটি ডিফল্ট সিক্রেট কী দেওয়া ভালো
const JWT_SECRET = process.env.JWT_SECRET_KEY || "your_jwt_secret_key";

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

module.exports = generateToken;
