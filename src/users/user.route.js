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
  forgotPassword,
  resetPassword, // 👈 ১. রিসেট পাসওয়ার্ড কন্ট্রোলারটি ইম্পোর্ট করা হলো
} = require('./user.controller');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

// Auth Routes (Public)
router.post('/register', userRegistration);
router.post('/login', userLoggedIN);
router.post('/logout', userLogout);

// Password Reset Routes (Public)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword); // 👈 ২. রিসেট পাসওয়ার্ড রাউট (টোকেনসহ)

// Profile Routes (Protected - Logged in user only)
router.patch('/edit-profile/:id', verifyToken, editUserProfile);

// User Management Routes (Protected - Admin only)
router.get('/users', verifyToken, verifyAdmin, getAllUsers);
router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/users/:id', verifyToken, verifyAdmin, updateUserRole);

module.exports = router;