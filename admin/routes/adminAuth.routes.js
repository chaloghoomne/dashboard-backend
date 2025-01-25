const router = require("express").Router();
const adminAuthController = require("../controllers/adminAuth.controller");
const auth = require("../../middlewares/auth");
const { upload } = require("../../utils/upload");

router.post("/admin-signup", adminAuthController.adminSignup);
router.post("/admin-login", adminAuthController.adminLogin);
router.post("/admin-change-password", adminAuthController.adminChangePassword);
router.post("/admin-forgot-password", adminAuthController.adminForgotPassword);
router.post(
  "/admin-reset-password",
  auth,
  adminAuthController.adminResetPassword
);
router.get("/admin-profile", auth, adminAuthController.adminProfile);
router.put(
  "/admin-edit-profile",
  auth,
  upload,
  adminAuthController.adminEditProfile
);

module.exports = router;
