const express = require('express');
const router = express.Router();

// ❌ ভুল ছিল: const { ... } = require('../controllers/contactController');
// ✅ সঠিক (একই ফোল্ডারে থাকা contact.controller.js কে ইম্পোর্ট করা হলো):
const {
  createContactMessage,
  getAllContactMessages,
  updateMessageStatus,
  deleteContactMessage,
} = require('./contact.controller');

// পাবলিক রাউট (ইউজার মেসেজ পাঠানোর জন্য)
router.post('/', createContactMessage);

// অ্যাডমিন রাউট (অ্যাডমিন মেসেজ দেখা ও হ্যান্ডেল করার জন্য)
router.get('/', getAllContactMessages);
router.patch('/:id/read', updateMessageStatus);
router.delete('/:id', deleteContactMessage);

module.exports = router;