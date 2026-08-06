const express = require("express");
const router = express.Router();

const { errorResponse, successResponse } = require("../utilis/responsHandler");

const User = require("../users/user.model");
const Order = require("../orders/order.model");
const Review = require("../reviews/review.model");
const Product = require("../products/product.model");

// Authentication & Admin Validation Middleware Import
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

// ================= USER STATS =================
router.get("/user-stats/:email", verifyToken, async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return errorResponse(res, 400, "Email is required");
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    // 🔒 Security Check: ইউজার শুধু তার নিজের স্ট্যাটস দেখতে পারবে (যদি না সে অ্যাডমিন হয়)
    if (req.role !== "admin" && req.userId !== user._id.toString()) {
      return errorResponse(res, 403, "Access denied! You can only view your own stats.");
    }

    const totalPaymentsResult = await Order.aggregate([
      { $match: { email } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const totalPayments =
      totalPaymentsResult.length > 0 && totalPaymentsResult[0].totalAmount
        ? totalPaymentsResult[0].totalAmount
        : 0;

    const totalReviews = await Review.countDocuments({
      userId: user._id,
    });

    const purchasedProductsIds = await Order.distinct(
      "products.productId",
      { email }
    );

    return successResponse(res, 200, "Fetched user stats successfully", {
      totalPayments: Number(totalPayments.toFixed(2)),
      totalReviews,
      totalPurchasedProducts: purchasedProductsIds.length,
    });
  } catch (error) {
    return errorResponse(res, 500, "Couldn't get user stats", error.message);
  }
});

// ================= ADMIN STATS =================
router.get("/admin-stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Total Earnings
    const totalEarningsResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const totalEarnings =
      totalEarningsResult.length > 0 && totalEarningsResult[0].totalEarnings
        ? totalEarningsResult[0].totalEarnings
        : 0;

    // Monthly Earnings
    const monthlyEarningsResult = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          monthlyEarnings: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthlyEarnings = monthlyEarningsResult.map((entry) => ({
      month: monthNames[entry._id.month - 1],
      year: entry._id.year,
      earnings: Number((entry.monthlyEarnings || 0).toFixed(2)),
    }));

    // Total Products Sold
    const totalProductsSoldResult = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: null,
          totalProductsSold: {
            $sum: "$products.quantity",
          },
        },
      },
    ]);

    const totalProductsSold =
      totalProductsSoldResult.length > 0 && totalProductsSoldResult[0].totalProductsSold
        ? totalProductsSoldResult[0].totalProductsSold
        : 0;

    return successResponse(res, 200, "Fetched admin stats successfully", {
      totalUsers,
      totalProducts,
      totalOrders,
      totalReviews,
      totalProductsSold,
      totalEarnings: Number(totalEarnings.toFixed(2)),
      monthlyEarnings,
    });
  } catch (error) {
    return errorResponse(res, 500, "Couldn't get admin stats", error.message);
  }
});

module.exports = router;