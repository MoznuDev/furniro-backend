const verifyAdmin = (req, res, next) => {
  // 💡 req.role অথবা req.user.role - যেকোনো জায়গা থেকে রোল সংগ্রহ করা
  const userRole = req.role || req.user?.role;

  if (!userRole || userRole !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: "Forbidden access! Admin role required." 
    });
  }
  
  next();
};

module.exports = verifyAdmin;