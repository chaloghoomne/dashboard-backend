const UserNotification = require("../../user/models/userNotification.model");
const User = require("../../user/models/user.model");
const AdminNotification = require("../models/adminNotification.model");
const adminValidator = require("../../validators/admin.validators");
const paginate = require("../../utils/paginate");
const { notificationQueue } = require("../../queue/notification.queue");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async adminSendNotification(req, res) {
    try {
      const { title, body, userIds } = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;

      let imageUrl = null;

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          imageUrl = uploadImage.cdnUrl;
        }
      }

      let userNotification;

      if (userIds && userIds.length > 0) {
        userNotification = new UserNotification({
          title,
          body,
          users: userIds,
          image: imageUrl || null,
        });
        await userNotification.save();

        await User.updateMany(
          { _id: { $in: userIds } },
          { $push: { unreadNotifications: userNotification._id } }
        );
      }

      // let images = [];

      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: userNotification._id,
      //     modelName: "UserNotification",
      //     field: "image",
      //   });
      // }

      // if (images.length > 0) {
      //   uploadImages(images)
      //     .then(async (results) => {
      const jobId = `notification-${Date.now()}`;

      const job = await notificationQueue.add(jobId, {
        title,
        body,
        image: imageUrl || null,
        userIds,
        userNotificationId: userNotification ? userNotification._id : null,
      });
      //       console.log("All uploads completed", results);
      //     })
      //     .catch((error) => {
      //       console.error("Error in batch upload:", error);
      //     });
      // } else {
      //   const jobId = `notification-${Date.now()}`;

      //   const job = await notificationQueue.add(jobId, {
      //     title,
      //     body,
      //     userIds,
      //   });
      // }

      return res.status(200).json({
        message: "Notification sent successfully",
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

  async getAllUserNotifications(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      const totalItems = await UserNotification.countDocuments();
      const totalPages = Math.ceil(totalItems / take);
      let startNumber;
      let notifications;
      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;
        notifications = await UserNotification.find()
          .skip(skip)
          .limit(take)
          .populate("users")
          .sort({ createdAt: -1 });
        notifications = notifications.map((notification, index) => {
          return {
            ...notification.toObject(),
            s_no: startNumber + index,
          };
        });
      } else {
        startNumber = 1;
        notifications = await UserNotification.find()
          .populate("users")
          .sort({ createdAt: -1 });
        notifications = notifications.map((notification, index) => {
          return {
            ...notification.toObject(),
            s_no: startNumber + index,
          };
        });
      }
      return res.status(200).json({
        data: notifications,
        message: "Notifications fetched successfully",
        success: true,
        totalPages,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getUserNotificationById(req, res) {
    try {
      const { id } = req.params;

      const notification = await UserNotification.findById(id).populate(
        "users"
      );

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found",
          success: false,
        });
      }

      return res.status(200).json({
        data: notification,
        message: "Notification fetched successfully",
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

  async getAllAdminNotifications(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      const totalItems = await AdminNotification.countDocuments();
      const totalPages = Math.ceil(totalItems / take);
      let startNumber;
      let notifications;
      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;
        notifications = await AdminNotification.find()
          .skip(skip)
          .limit(take)
          .sort({ createdAt: -1 });
        notifications = notifications.map((notification, index) => {
          return {
            ...notification.toObject(),
            s_no: startNumber + index,
          };
        });
      } else {
        startNumber = 1;
        notifications = await AdminNotification.find().sort({ createdAt: -1 });
        notifications = notifications.map((notification, index) => {
          return {
            ...notification.toObject(),
            s_no: startNumber + index,
          };
        });
      }

      return res.status(200).json({
        data: notifications,
        message: "Notifications fetched successfully",
        success: true,
        totalPages,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getAdminNotificationById(req, res) {
    try {
      const { id } = req.params;

      const notification = await AdminNotification.findById(id);

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found",
          success: false,
        });
      }

      return res.status(200).json({
        data: notification,
        message: "Notification fetched successfully",
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
