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
      select: false, // বাই-ডিফল্ট কুয়েরিতে পাসওয়ার্ড আসবে না
    },

    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: "",
    },

    profession: {
      type: String,
      maxlength: [100, "Profession cannot exceed 100 characters"],
      default: "",
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

    // 🛠️ পাসওয়ার্ড রিসেটের ফিল্ড (কন্ট্রোলারের সাথে সামঞ্জস্য রেখে সংশোধন)
    resetPasswordToken: {
      type: String,
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

// HASH PASSWORD (সেভ বা পাসওয়ার্ড মডিফাই করার আগে হ্যাশ করা)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// COMPARE PASSWORD (লগইনের সময় পাসওয়ার্ড মেলানো)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;