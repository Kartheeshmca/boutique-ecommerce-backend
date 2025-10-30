import express from "express";
import {
  createAddress,
  getAllAddresses,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} from "../Controller/Address.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";

const router = express.Router();

// Create new address
router.post("/create", Auth, authorizeRoles("user", "admin", "super admin"), createAddress);

// Get all addresses (admin only)
router.get("/all", Auth, authorizeRoles("admin", "super admin"), getAllAddresses);

// Get addresses by user
router.get("/user/:userId", Auth, authorizeRoles("user", "admin", "super admin"), getUserAddresses);

// Update address
router.put("/update/:id", Auth, authorizeRoles("user", "admin", "super admin"), updateAddress);

// Delete address
router.delete("/delete/:id", Auth, authorizeRoles("user", "admin", "super admin"), deleteAddress);

export default router;
