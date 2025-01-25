const { Queue, Worker } = require("bullmq");
const sendNotification = require("../utils/sendNotification");
const UserNotification = require("./../user/models/userNotification.model");
const AdminNotification = require("./../admin/models/adminNotification.model");
const User = require("./../user/models/user.model");
const Admin = require("./../admin/models/admin.model");

const notificationQueue = new Queue("notificationQueue", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

async function notificationQueueWorker() {
  const worker = new Worker(
    "notificationQueue",
    async (job) => {
      const { title, body, image, userIds, adminId, userNotificationId } =
        job.data;
      const BATCH_SIZE = 500;

      try {
        if (userIds && userIds.length > 0) {
          if (!userNotificationId) {
            const userNotification = await UserNotification.create({
              title,
              body,
              users: userIds,
            });

            // Update users' unread notifications
            await User.updateMany(
              { _id: { $in: userIds } },
              { $push: { unreadNotifications: userNotification._id } }
            );
          }

          // Process users in batches
          const uniqueUserIds = [...new Set(userIds)];
          for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
            const batchUserIds = uniqueUserIds.slice(i, i + BATCH_SIZE);
            const users = await User.find({ _id: { $in: batchUserIds } });

            const promises = users.map((user) => {
              return sendNotification(
                title,
                body,
                image || null,
                user.deviceToken
              );
            });
            await Promise.all(promises);

            if (i + BATCH_SIZE < uniqueUserIds.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        if (adminId) {
          const admin = await Admin.findOne({});

          const adminNotification = await AdminNotification.create({
            title,
            body,
            admins: admin._id,
          });

          await Admin.updateOne(
            { _id: admin._id },
            { $push: { unreadNotifications: adminNotification._id } }
          );

          if (admin) {
            await sendNotification(
              title,
              body,
              image || null,
              admin.deviceToken
            );
          }
        }

        console.log("Notification saved and sent successfully");
        return true;
      } catch (error) {
        console.error("Error processing notification job:", error);
        throw error;
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed with ${err.message}`);
  });
}

module.exports = {
  notificationQueue,
  notificationQueueWorker,
};
