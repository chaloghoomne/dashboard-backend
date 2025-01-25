const router = require("express").Router();
const adminNotificationController = require("../controllers/adminNotification.controller");
const { upload } = require("../../utils/upload");

router.post(
  "/admin-send-notification",
  upload,
  adminNotificationController.adminSendNotification
);

router.get(
  "/users-notifications",
  adminNotificationController.getAllUserNotifications
);

router.get(
  "/user-notification/:id",
  adminNotificationController.getUserNotificationById
);

router.get(
  "/admins-notifications",
  adminNotificationController.getAllAdminNotifications
);

router.get(
  "/admin-notification/:id",
  adminNotificationController.getAdminNotificationById
);

module.exports = router;
