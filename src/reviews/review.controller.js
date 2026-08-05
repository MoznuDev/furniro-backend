const products = require("../products/product.model");
const { errorResponse, successResponse } = require("../utilis/responsHandler");
const ReviewModel = require("./review.model");

// ১. POST অথবা UPDATE REVIEW
const postAReview = async (req, res) => {
  try {
    const { comment, rating, userId, productId } = req.body;

    // ✅ field validation
    if (!comment || rating === undefined || !productId || !userId) {
      return errorResponse(res, 400, "Missing required fields");
    }

    // ✅ rating range validation
    if (rating < 1 || rating > 5) {
      return errorResponse(res, 400, "Rating must be between 1 and 5");
    }

    const existingReview = await ReviewModel.findOne({ userId, productId });

    if (existingReview) {
      existingReview.comment = comment;
      existingReview.rating = rating;
      const updatedReview = await existingReview.save();
      await updateProductRating(productId);

      // ✅ successResponse ব্যবহার করা হয়েছে
      return successResponse(res, 200, "Review updated successfully", updatedReview);
    }

    const newReview = new ReviewModel({ comment, rating, userId, productId });
    const savedReview = await newReview.save();
    await updateProductRating(productId);

    // ✅ successResponse ব্যবহার করা হয়েছে
    return successResponse(res, 201, "Review posted successfully", savedReview);

  } catch (error) {
    console.error("Review Error:", error);
    return errorResponse(res, 500, "Failed to post review", error);
  }
};

// ২. HELPER — প্রোডাক্টের গড় রেটিং আপডেট
const updateProductRating = async (productId) => {
  try {
    const allReviews = await ReviewModel.find({ productId });

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalRating / allReviews.length;

      const product = await products.findById(productId);
      if (product) {
        product.rating = Number(averageRating.toFixed(1));
        await product.save({ validateBeforeSave: false });
      }
    }
  } catch (err) {
    console.error("Rating update error:", err.message);
  }
};

// ৩. GET USER REVIEWS
const getUserReview = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId) {
      return errorResponse(res, 400, "Missing user ID");
    }

    const userReviews = await ReviewModel.find({ userId }).sort({ createdAt: -1 });

    if (userReviews.length === 0) {
      return errorResponse(res, 404, "No reviews found for this user");
    }

    return successResponse(res, 200, "Reviews fetched successfully", userReviews);
  } catch (error) {
    return errorResponse(res, 500, "Failed to get user reviews", error);
  }
};

// ৪. GET TOTAL REVIEWS COUNT
const getTotalReviewsCount = async (req, res) => {
  try {
    const totalReviews = await ReviewModel.countDocuments({});
    return successResponse(res, 200, "Total review count fetched successfully", { totalReviews });
  } catch (error) {
    return errorResponse(res, 500, "Failed to get total review count", error);
  }
};

module.exports = {
  postAReview,
  getUserReview,
  getTotalReviewsCount,
};