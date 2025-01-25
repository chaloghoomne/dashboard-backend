const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userVerificationSchema = new Schema(
  {
    phoneNumber: {
      type: String,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpiry: Date,
  },
  { timestamps: true }
);

const userVerification = mongoose.model(
  "userVerification",
  userVerificationSchema
);
module.exports = userVerification;
