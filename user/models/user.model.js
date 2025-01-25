const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: String,
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    image: String,
    email: {
      type: String,
    },
    gender: {
      type: String,
    },
    dob: {
      type: Date,
    },
    occupation: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    password: {
      type: String,
    },
    isUser: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    suspendedUntill: {
      type: Date,
    },
    googleAuth: {
      type: Boolean,
      default: false,
    },
    unreadNotifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "UserNotification" },
    ],
    otp: {
      type: String,
    },
    otpExpiration: {
      type: Date,
    },
    deviceToken: String,
    passportNumber: String,
    passportExpiry: Date,
    addressLineOne: String,
    addressLineTwo: String,
    city: String,
    state: String,
    balance: {
      type: Number,
      default: 0,
    },
    token: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
