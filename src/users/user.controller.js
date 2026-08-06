const User = require("./user.model");
const generateToken = require("../middleware/generateToken");
const { successResponse, errorResponse } = require("../utilis/responsHandler");
const crypto = require("crypto"); // 👈 সিকিউর র্যান্ডম টোকেন তৈরির জন্য
const nodemailer = require("nodemailer"); // 👈 রিয়েল ইমেইল পাঠানোর জন্য

// ১. REGISTER
const userRegistration = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return errorResponse(res, 400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, "User already exists");
    }

    const user = new User({ username, email, password });
    await user.save();

    return successResponse(res, 201, "User registered successfully!");

  } catch (error) {
    errorResponse(res, 500, "Registration failed!", error);
  }
};

// ২. LOGIN
const userLoggedIN = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "All fields are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const token = await generateToken(user._id, user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return successResponse(res, 200, "Login successful!", {
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio:user.bio,
        profession: user.profession,
      },
    });

  } catch (error) {
    errorResponse(res, 500, "Login failed!", error);
  }
};

// ৩. LOGOUT
const userLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    successResponse(res, 200, "Logged out successfully");
  } catch (error) {
    errorResponse(res, 500, "Logout failed", error);
  }
};

// ৪. GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "email role").sort({ createdAt: -1 });
    successResponse(res, 200, "All users fetched successfully", users);
  } catch (error) {
    errorResponse(res, 500, "Failed to fetch all users!", error);
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
    errorResponse(res, 500, "Failed to delete user!", error);
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
    errorResponse(res, 500, "Failed to update user role!", error);
  }
};

// ৭. EDIT USER PROFILE
const editUserProfile = async (req, res) => {
  const { id } = req.params;
 

  const { username, profileImage, bio, profession } = req.body;

  try {
    const updateFields = { username, profileImage, bio, profession };
    const updatedUser = await User.findByIdAndUpdate(
  id,
  updateFields,
  {
    returnDocument: "after", // Mongoose 8+ এর জন্য
    runValidators: true,
  }
);


    if (!updatedUser) {
      return errorResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "Profile updated successfully", updatedUser);
  } catch (error) {
    errorResponse(res, 500, "Failed to update profile!", error);
  }
};

// 🛠️ ৮. FORGOT PASSWORD (নতুন যুক্ত করা হলো)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    // ডাটাবেজে ইউজার চেক করা
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, "User with this email does not exist");
    }

    // ১ ঘণ্টার জন্য ভ্যালিড রিসেট টোকেন তৈরি
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    // Nodemailer ট্রান্সপোর্টার (জিমেইলের জন্য)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // .env থেকে আপনার মেইল
        pass: process.env.EMAIL_PASS, // .env থেকে জিমেইল অ্যাপ পাসওয়ার্ড
      },
    });

    // ফ্রন্টঅ্যান্ডের পাসওয়ার্ড রিসেট করার ইউআরএল
    const clientUrl = process.env.CLIENT_URL || 'https://furniro-client-3e62-git-main-moznudevs-projects.vercel.app';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #dc2626; text-align: center;">পাসওয়ার্ড রিসেট রিকোয়েস্ট</h2>
          <p>হ্যালো <strong>${user.username}</strong>,</p>
          <p>আপনার অ্যাকাউন্ট থেকে পাসওয়ার্ড রিসেট করার একটি অনুরোধ এসেছে। নিচের বাটনে ক্লিক করে পাসওয়ার্ডটি রিসেট করুন:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">এই লিঙ্কটি আগামী ১ ঘণ্টা সচল থাকবে। আপনি অনুরোধ না করে থাকলে এই মেইলটি ইগনোর করুন।</p>
        </div>
      `,
    };

    // ইমেইল পাঠানো
    await transporter.sendMail(mailOptions);

    return successResponse(res, 200, "পাসওয়ার্ড রিসেট লিঙ্ক সফলভাবে ইমেইলে পাঠানো হয়েছে।");

  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse(res, 500, "Internal Server Error! ইমেইল পাঠানো সম্ভব হয়নি।", error);
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
  forgotPassword, // 👈 এক্সপোর্ট লিস্টে যুক্ত করা হলো
};