const express = require('express');
const { postAReview, getUserReview, getTotalReviewsCount } = require('./review.controller');
const router = express.Router();

// ১. পোস্ট রিভিউ (POST)
router.post('/post-review', postAReview);

// ২. টোটাল রিভিউ কাউন্ট (GET) - এটিকে উপরে নিয়ে আসা হয়েছে
router.get('/total-review', getTotalReviewsCount);

// ৩. নির্দিষ্ট ইউজারের সব রিভিউ (GET) - ডাইনামিক রাউটটি নিচে রাখা হয়েছে
router.get('/:userId', getUserReview);


module.exports = router;