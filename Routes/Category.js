import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../Controller/Category.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";

const router = express.Router();

// Create category (Admin & Super Admin)
router.post("/create", Auth, authorizeRoles("admin", "super admin"), createCategory);

// Get all categories (All roles)
router.get("/all", Auth, authorizeRoles("user", "admin", "super admin"), getAllCategories);

// Get category by ID (All roles)
router.get("/byId/:id", Auth, authorizeRoles("user", "admin", "super admin"), getCategoryById);

// Update category (Admin & Super Admin)
router.put("/update/:id", Auth, authorizeRoles("admin", "super admin"), updateCategory);

// Delete category (Super Admin only)
router.delete("/delete/:id", Auth, authorizeRoles("super admin"), deleteCategory);

export default router;
