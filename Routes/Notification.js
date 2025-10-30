import express from "express";
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  getAllNotifications,
} from "../Controller/Notification.js";

const router = express.Router();

// Create notification
router.post("/create", createNotification);

// Get notifications for a specific user
router.get("/Id/:userId", getUserNotifications);

// Mark as read
router.put("/update/:id/read", markAsRead);

// Delete notification
router.delete("/delete/:id", deleteNotification);

// Get all notifications (admin)
router.get("/all", getAllNotifications);

export default router;
