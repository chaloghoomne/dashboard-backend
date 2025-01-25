const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userNotificationSchema = new Schema(
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
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const UserNotification = mongoose.model(
  "UserNotification",
  userNotificationSchema
);

module.exports = UserNotification;
