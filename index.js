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
  "https://furniro-client-ljni.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Postman/Mobile apps বা Non-browser রিকোয়েস্ট এলাউ করা
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, "");
    
    // Check exact or wildcard vercel subdomain matching
    const isAllowed =
      allowedOrigins.some((o) => o.replace(/\/$/, "") === cleanOrigin) ||
      cleanOrigin.endsWith(".vercel.app"); // সব vercel.app সাবডোমেইন এলাউ করার নিরাপদ ট্রিক

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log("CORS Blocked Origin:", origin);
      // ✅ Error থ্রো না করে false পাস করা হলো যাতে সার্ভার ক্র্যাশ না করে প্রপার ৪-০-৩ রেসপন্স পাঠায়
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

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

// সব Route-এর আগে DB Connection Check
app.use(async (req, res) => {
  try {
    await connectDB();
  
  } catch (err) {
    console.error("Database middleware error:", err);
    res.status(500).json({ success: false, message: "Database Connection Error" });
  }
});

// ======================
// Upload Image Utility
// ======================
const uploadImage = require("./src/utilis/uploadImage");

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
app.post("/uploadImage", async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image input provided",
      });
    }

    const imageUrl = await uploadImage(image);

    return res.status(200).json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
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
  console.error("Global Error Log:", err.stack || err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Vercel Serverless Function-এর বাইরে পোর্টে রান করানোর ব্যবস্থা
if (process.env.VERCEL !== "1") {
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });
}

module.exports = app;