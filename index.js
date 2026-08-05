const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ======================
// Dynamic Allowed Origins for CORS
// ======================
const allowedOrigins = [
  "http://localhost:5173",
  "https://furniro-client-3e62.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman বা Server-to-Server রিকোয়েস্টে origin থাকে না
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (o) => o.replace(/\/$/, "") === cleanOrigin
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("CORS Blocked Origin:", origin);
        // Error থ্রো না করে সুন্দরভাবে false পাঠানো হলো যাতে Vercel Crash না করে
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Payload limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser());

// ======================
// Database Connection (Serverless Friendly)
// ======================
let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;

  try {
    const db = await mongoose.connect(process.env.DB_URL);
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
  }
}

// ⚠️ সব Route-এর আগে DB Connection Check নিশ্চিত করতে হবে
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ======================
// Upload Image Utility
// ======================
// ⚠️ আপনার ফোল্ডারের নাম utils নাকি utilis সেটির বানান খেয়াল রাখুন
const { uploadImage } = require("./src/utilis/uploadImage");

// ======================
// Routes
// ======================
app.use("/api/auth", require("./src/users/user.route"));
app.use("/api/products", require("./src/products/product.route"));
app.use("/api/reviews", require("./src/reviews/review.route"));
app.use("/api/orders", require("./src/orders/order.route"));
app.use("/api/stats", require("./src/stats/stats.route"));
app.use("/api/contact", require("./src/contact/contact.route"));
app.use("/api/blogs", require("./src/blog/blog.route"));

// Upload Image API
app.post("/uploadImage", async (req, res) => {
  try {
    const imageUrl = await uploadImage(req.body.image);

    res.status(200).json(imageUrl);
  } catch (error) {
    console.error("Upload Error:", error);

    res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error.message,
    });
  }
});

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Furniro E-commerce API is running",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Local Development-এর জন্য
if (process.env.NODE_ENV !== "production") {
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });
}

module.exports = app;