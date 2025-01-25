const UserNotification = require("../models/userNotification.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

module.exports = {
  async getAllNotifications(req, res) {
    try {
      const userId = req.user.id;

      // Find all notifications that include the user's ID
      const notifications = await UserNotification.find({ users: userId }).sort(
        {
          createdAt: -1,
        }
      );

      const user = await User.findById(userId).select("unreadNotifications");

      const notificationData = notifications.map((notification) => {
        return {
          ...notification.toObject(),
          isRead: !user.unreadNotifications.includes(notification._id),
        };
      });

      return res.status(200).json({
        data: notificationData,
        message: "Notifications fetched successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async markRead(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      // Check if the notification exists in unreadNotifications
      const notificationIndex = user.unreadNotifications.findIndex(
        (notificationId) => notificationId.toString() === id
      );

      if (notificationIndex === -1) {
        return res.status(404).json({
          message: "Notification not found",
          success: false,
        });
      }

      // Remove the notification from unreadNotifications
      user.unreadNotifications.splice(notificationIndex, 1);
      await user.save();

      return res.status(200).json({
        message: "Notification marked as read",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async markReadAll(req, res) {
    try {
      const user = await User.findById(req.user.id);
      user.unreadNotifications = [];
      await user.save();
      return res.status(200).json({
        message: "All notifications marked as read",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Step 1: Remove the notification ID from the user's unreadNotifications array
      const userUpdateResult = await User.updateOne(
        { _id: userId },
        { $pull: { unreadNotifications: new mongoose.Types.ObjectId(id) } }
      );

      // Step 2: Remove the user ID from the notification's users array
      const notificationUpdateResult = await UserNotification.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $pull: { users: new mongoose.Types.ObjectId(userId) } }
      );

      // Check if the operations were successful
      if (userUpdateResult.nModified === 0) {
        return res.status(404).json({
          message:
            "User not found or notification ID not in unreadNotifications",
          success: false,
        });
      }

      if (notificationUpdateResult.nModified === 0) {
        return res.status(404).json({
          message: "Notification not found or user ID not in users",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Notification deleted successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deleteAllNotifications(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      user.unreadNotifications = [];
      await UserNotification.updateMany(
        { users: userId },
        { $pull: { users: userId } }
      );

      await user.save();

      return res.status(200).json({
        message: "All notifications deleted successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },
};
