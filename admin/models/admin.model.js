const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSchema = new Schema(
  {
    email: {
      type: String,
      lowercase: true,
    },
    image: String,
    isAdmin: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
    },
    otp: {
      type: String,
    },
    deviceToken: String,
    unreadNotifications: [
      {
        type: Schema.Types.ObjectId,
        ref: "AdminNotification",
      },
    ],
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
