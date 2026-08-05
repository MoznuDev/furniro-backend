const express = require('express');
const router = express.Router();
const {
  userRegistration,
  userLoggedIN,
  userLogout,
  getAllUsers,
  deleteUser,
  updateUserRole,
  editUserProfile,
  forgotPassword, // 👈 ১. আপনার কন্ট্রোলার ফাইল থেকে এই ফাংশনটি ইম্পোর্ট করুন (নামটি মিলিয়ে নেবেন)
} = require('./user.controller');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

// Register
router.post('/register', userRegistration);

// Login
router.post('/login', userLoggedIN);

// Logout
router.post('/logout', userLogout);

// ✅ ২. Forgot Password রাউট (এখানে কোনো টোকেন ভেরিফিকেশনের প্রয়োজন নেই, কারণ ইউজার লগইন ছাড়াই এটি অ্যাক্সেস করবে)
router.post('/forgot-password', forgotPassword);

// Get all users — admin only
router.get('/users', verifyToken, verifyAdmin, getAllUsers);

// আগে verifyToken, পরে verifyAdmin
router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/users/:id', verifyToken, verifyAdmin, updateUserRole);

// verifyToken যোগ করা হয়েছে
router.patch('/edit-profile/:id', verifyToken, editUserProfile);

module.exports = router;