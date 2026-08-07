const User = require("./user.model");
const generateToken = require("../middleware/generateToken");
const { successResponse, errorResponse } = require("../utilis/responsHandler");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ১. REGISTER
const userRegistration = async (req, res, next) => {
 
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return errorResponse(res, 400, "All fields are required");
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // 🛠️ ইমেইল অথবা ইউজারনেম আগে থেকে থাকলে ব্যাকএন্ড থেকেই ব্লক করবে
    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { username: cleanUsername },
      ],
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return errorResponse(res, 400, "Email is already registered");
      }
      if (existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return errorResponse(res, 400, "Username is already taken");
      }
    }

    // নতুন ইউজার তৈরি
    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      password,
    });

    await user.save();

    return successResponse(res, 201, "User registered successfully!");
  } catch (error) {
    console.error("Registration Error Details:", error);
  
    // Mongoose Validation Error (যেমন পাসওয়ারড লেন্থ ছোট হওয়া)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return errorResponse(res, 400, messages.join(", "), error.message);
    }

    // Duplicate Index Error (MongoDB Code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(res, 400, `This ${field} is already in use`);
    }

    return errorResponse(
      res,
      500,
      "Registration failed!",
      error.message || String(error)
    );
  }
};

// ২. LOGIN
const userLoggedIN = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "All fields are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const token = generateToken({
      userId: user._id,
      role: user.role,
    });

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, 200, "Login successful!", {
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        profession: user.profession,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, "Login failed!", error.message || String(error));
  }
};

// ৩. LOGOUT
const userLogout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    return successResponse(res, 200, "Logged out successfully");
  } catch (error) {
    return errorResponse(res, 500, "Logout failed", error.message || String(error));
  }
};

// ৪. GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "email role username profileImage createdAt").sort({ createdAt: -1 });
    return successResponse(res, 200, "All users fetched successfully", users);
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch all users!", error.message || String(error));
  }
};

// ৫. DELETE USER
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "User deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Failed to delete user!", error.message || String(error));
  }
};

// ৬. UPDATE USER ROLE
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowedRoles = ["user", "admin"];
  if (!allowedRoles.includes(role)) {
    return errorResponse(res, 400, "Invalid role provided");
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!updatedUser) {
      return errorResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "User role updated successfully", updatedUser);
  } catch (error) {
    return errorResponse(res, 500, "Failed to update user role!", error.message || String(error));
  }
};

// ৭. EDIT USER PROFILE
const editUserProfile = async (req, res) => {
  const { id } = req.params;
  const { username, profileImage, bio, profession } = req.body;

  try {
    const updateFields = { username, profileImage, bio, profession };
    const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updatedUser) {
      return errorResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "Profile updated successfully", updatedUser);
  } catch (error) {
    return errorResponse(res, 500, "Failed to update profile!", error.message || String(error));
  }
};

// ৮. FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return errorResponse(res, 404, "User with this email does not exist");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // ১ ঘণ্টা
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const clientUrl = process.env.CLIENT_URL || "https://furniro-client-3e62-git-main-moznudevs-projects.vercel.app";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Furniro Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #dc2626; text-align: center;">পাসওয়ার্ড রিসেট রিকোয়েস্ট</h2>
          <p>হ্যালো <strong>${user.username}</strong>,</p>
          <p>আপনার অ্যাকাউন্ট থেকে পাসওয়ার্ড রিসেট করার অনুরোধ পাওয়া গেছে। নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">এই লিঙ্কটি আগামী ১ ঘণ্টা সচল থাকবে। আপনি অনুরোধ না করে থাকলে এই মেইলটি ইগনোর করুন।</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return successResponse(res, 200, "পাসওয়ার্ড রিসেট লিঙ্ক সফলভাবে ইমেইলে পাঠানো হয়েছে।");
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse(res, 500, "Internal Server Error! ইমেইল পাঠানো সম্ভব হয়নি।", error.message || String(error));
  }
};

// ৯. RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, 400, "New password is required");
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 400, "Invalid or expired reset token");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return successResponse(res, 200, "Password reset successful! You can now log in.");
  } catch (error) {
    return errorResponse(res, 500, "Failed to reset password!", error.message || String(error));
  }
};

module.exports = {
  userRegistration,
  userLoggedIN,
  userLogout,
  getAllUsers,
  deleteUser,
  updateUserRole,
  editUserProfile,
  forgotPassword,
  resetPassword,
};