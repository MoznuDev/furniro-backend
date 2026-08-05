const { errorResponse } = require("../utilis/responsHandler");

const verifyAdmin = (req, res, next) => {
  // 💡 সতর্কতা: এই মিডলওয়্যারটি রাউটে অবশ্যই verifyToken এর পরে বসাতে হবে
  if (!req.role || req.role !== 'admin') {
    return res.status(403).json({ message: "Unauthorized access denied! Admin only." });
  }
  next();
};

module.exports = verifyAdmin;