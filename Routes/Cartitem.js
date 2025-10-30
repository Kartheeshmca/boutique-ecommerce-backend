import express from "express";
import {
  addItem,
  updateQuantity,
  removeItem,
  getCart,
  getUserCart,
} from "../Controller/Cartitem.js";
import { Auth } from "../Middleware/Auth.js";

const router = express.Router();

// Add item to cart
router.post("/add", Auth, addItem);

// Update quantity
router.put("/update", Auth, updateQuantity);

// Remove item
router.delete("/remove/:itemId", Auth, removeItem);

// Get current user's cart
router.get("/", Auth, getCart);

// Get cart by userId (admin or same user)
router.get("/user/:userId", Auth, getUserCart);

export default router;
