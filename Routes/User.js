import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  uploadProfileImage,
  getProfileImage,
  deleteProfileImage
} from "../Controller/User.js";

import { Auth, authorizeRoles } from "../Middleware/Auth.js";
import { upload } from "../Utils/cloud.js";

const router = express.Router();

// ---------- Public Routes ----------
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ---------- Admin Routes ----------
router.get("/all", Auth, authorizeRoles("admin", "super admin"), getAllUsers);
router.get("/byId/:id", Auth, authorizeRoles("admin", "super admin"), getUserById);

// ---------- Normal User Routes ----------
router.get("/me", Auth, getUserProfile); // view own profile
router.put("/update/:id", Auth, updateUserProfile); // update user info (name, phone, email, etc.)
router.delete("/delete/:id", Auth, deleteUserProfile); // delete user profile

// ---------- Profile Image Routes ----------
router.post("/upload-profile", Auth, upload.single("profileImage"), uploadProfileImage); // upload image
router.get("/profile-image/:id", getProfileImage); // get image URL by userId
router.delete("/delete-profile-image", Auth, deleteProfileImage); // delete profile image

export default router;
