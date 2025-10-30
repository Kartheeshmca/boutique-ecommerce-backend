import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../Models/User.js";
import { sendEmail } from "../Utils/sendemail.js";
import { v2 as cloudinary } from "cloudinary"; // ✅ Add this line
import fs from "fs";
import path from "path";

// JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// ---------------- Register ----------------
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, confirmPassword, profileImage } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Phone number must be 10 digits" });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({ message: "Password must contain at least one letter and one number" });
}


    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already registered" });

    user = await User.findOne({ phone });
    if (user) return res.status(400).json({ message: "Phone number already registered" });

    await User.create({ firstName, lastName, phone, email, password, profileImage });

    res.status(201).json({ message: "Registered successfully. You can login now." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Login ----------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one letter and one number" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user._id, user.role);
    res.json({
      token,
      id:user._id,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
      profileImage: user.profileImage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Forgot Password ----------------
// ---------------- Forgot Password ----------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Click here to reset your password: ${resetUrl}`;

    const htmlMessage = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // ✅ Fixed function call
    await sendEmail(user.email, "Password Reset", message, htmlMessage);

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Reset Password ----------------

// ---------------- Reset Password ----------------
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password"); // ✅ include password for comparison

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { password, confirmPassword } = req.body;

    // ✅ Check confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // ✅ Password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters and contain at least one letter and one number",
      });
    }

    // ✅ Prevent reusing old password
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ message: "New password cannot be the same as the old password" });
    }

    // ✅ Save new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Get User By ID ----------------
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Get All Users (already exists but explicitly) ----------------



// ---------------- Get All Users ----------------
// Get All Users with Pagination & Search

export const getAllUsers = async (req, res) => {
  try {
    let { search, role, status, page, limit } = req.query;
    const query = {};

    // Filter by status if provided
    if (status && ["Active", "Inactive"].includes(status)) {
      query.status = status;
    }

    // Filter by role if provided
    if (role) query.role = role;

    // Search by name, email, phone, role
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    let usersQuery = User.find(query).select("-password");

    let currentPage = 1;
    let perPage = 0;

    // Apply pagination only if limit is provided
    if (limit) {
      currentPage = parseInt(page) || 1;
      perPage = parseInt(limit);
      const skip = (currentPage - 1) * perPage;
      usersQuery = usersQuery.skip(skip).limit(perPage);
    }

    const users = await usersQuery;
    const total = await User.countDocuments(query);

    if (!users.length) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    res.json({
      success: true,
      page: limit ? currentPage : 1,
      limit: limit ? perPage : total,
      totalUsers: total,
      totalPages: limit ? Math.ceil(total / perPage) : 1,
      users,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Update User ----------------



// ---------------- Admin Only ----------------



// Get own profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Update user by id (normal or admin)
export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, profileImage } = req.body;
    const userId = req.params.id;

    // If normal user, ensure they can only update their own profile
    if (req.user.role === "user" && req.user.id !== userId) {
      return res.status(403).json({ message: "You are not allowed to update this user" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check duplicate email/phone
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) return res.status(400).json({ message: "Email already in use" });
    }
    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingPhone) return res.status(400).json({ message: "Phone already in use" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.profileImage = profileImage || user.profileImage;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user by id (normal or admin)
// ---------------- Soft Delete User by id ----------------
export const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // If normal user, ensure they can only deactivate their own account
    if (req.user.role === "user" && req.user.id !== userId) {
      return res.status(403).json({ message: "You are not allowed to deactivate this user" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Soft delete: mark as inactive
    user.status = "Inactive";
    await user.save();

    res.json({ message: "User marked as Inactive successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





// ---------------- Upload Profile Image ----------------
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete old image from Cloudinary if exists
    if (user.profileImagePublicId) {
      await cloudinary.uploader.destroy(user.profileImagePublicId);
    }

    // Upload new image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "boutique/profile",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    user.profileImage = result.secure_url;
    user.profileImagePublicId = result.public_id;
    await user.save();

    res.json({ message: "Profile image uploaded successfully", profileImage: user.profileImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.profileImage) {
      return res.status(404).json({ message: "Profile image not found" });
    }

    // Just return the Cloudinary URL
    res.json({ profileImage: user.profileImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const deleteProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.profileImagePublicId) {
      return res.status(400).json({ message: "No profile image to delete" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(user.profileImagePublicId);

    // Clear user fields
    user.profileImage = "";
    user.profileImagePublicId = "";
    await user.save();

    res.json({ message: "Profile image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
