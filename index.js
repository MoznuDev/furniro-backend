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
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (o) => o.replace(/\/$/, "") === cleanOrigin
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("CORS Blocked Origin:", origin);
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Payload limit (Base64 ইমেজের জন্য বড় পেলোড দরকার)
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
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ======================
// Upload Image Utility
// ======================
// ✅ Fix: Destructuring বাদ দিয়ে সরাসরি ইম্পোর্ট করা হয়েছে
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

    // ফ্রন্টএন্ড সহজে পড়ার জন্য একটি অবজেক্ট আকারে পাঠাতে পারেন
    res.status(200).json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    next(error); // Global Error Handler এ পাঠানো হলো
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

// Vercel Serverless Function-এর বাইরে পোর্টে রান করানোর ব্যবস্থা
if (process.env.VERCEL !== "1") {
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });
}

module.exports = app;