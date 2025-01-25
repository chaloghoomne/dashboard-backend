const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminNotificationSchema = new Schema(
  {
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    image: {
      type: String,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

const AdminNotification = mongoose.model(
  "AdminNotification",
  adminNotificationSchema
);

module.exports = AdminNotification;
