import Notification from "../Models/Notification.js";

export const createNotification = async (req, res) => {
  try {
    const { user_id, message, type } = req.body;

    const notification = await Notification.create({
      user_id,
      message,
      type,
    });

    res.status(201).json({ message: "Notification created", notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.params.userId })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { is_read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all notifications (admin)
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().populate("user_id");
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
