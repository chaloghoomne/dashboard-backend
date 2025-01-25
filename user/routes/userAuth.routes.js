const router = require("express").Router();
const userAuthController = require("../controllers/userAuth.controller");
const auth = require("../../middlewares/auth");
const { upload } = require("../../utils/upload");

router.post("/user-signup", userAuthController.userSignup);
router.post("/user-login", userAuthController.userLogin);
router.get("/user/:id", userAuthController.getUser);
router.post("/user-reset-password", userAuthController.userResetPassword);
router.post("/user-change-password", userAuthController.userChangePassword);
router.post("/user-google-login", userAuthController.userGoogleLogin);
router.post("/user-verify-number", userAuthController.verifyMobileOtp);
router.get("/user-profile", auth, userAuthController.userProfile);
router.post("/user-forgot-password", userAuthController.userForgotPassword);
router.put(
  "/user-edit-profile/:id",
  upload,
  userAuthController.userEditProfile
);
router.post("/send-otp", userAuthController.sendMailOtp);
router.post("/verify-otp", userAuthController.verifyMailOtp);
router.post("/send-mobile-otp", userAuthController.sendMobileOtp);
router.put("/update-device-token", auth, userAuthController.updateDeviceToken);

module.exports = router;
