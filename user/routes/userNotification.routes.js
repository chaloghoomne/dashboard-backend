const router = require("express").Router();
const userNotificationController = require("../controllers/userNotification.controller");
const auth = require("../../middlewares/auth");

router.get(
  "/notifications",
  auth,
  userNotificationController.getAllNotifications
);

router.put("/read-notification/:id", auth, userNotificationController.markRead);

router.put(
  "/read-all-notifications",
  auth,
  userNotificationController.markReadAll
);

router.delete(
  "/delete-notification/:id",
  auth,
  userNotificationController.deleteNotification
);

router.delete(
  "/delete-notifications",
  auth,
  userNotificationController.deleteAllNotifications
);
module.exports = router;
