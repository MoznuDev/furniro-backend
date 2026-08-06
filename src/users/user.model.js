const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // বাই-ডিফল্ট কুয়েরিতে পাসওয়ার্ড আসবে না
    },

    bio: { 
      type: String, 
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: "" 
    },
    
    profession: { 
      type: String, 
      maxlength: [100, "Profession cannot exceed 100 characters"],
      default: "" 
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    profileImage: {
      type: String,
      default: "",
    },

    // 🛠️ পাসওয়ার্ড রিসেটের জন্য ফিল্ড
    resetPasswordToken: {
      type: String,
      select: false, // নিরাপত্তার জন্য সাধারণ ফাইন্ড কুয়েরিতে আসবে না
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// HASH PASSWORD (সেভ করার আগে পাসওয়ার্ড হ্যাশ করা)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// COMPARE PASSWORD (লগইনের সময় পাসওয়ার্ড মেলানো)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;