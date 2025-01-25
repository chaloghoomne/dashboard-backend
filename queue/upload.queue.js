const { Queue, Worker } = require("bullmq");
const uploadToS3 = require("../utils/uploadToS3");
const mongoose = require("mongoose");

const uploadQueue = new Queue("uploadQueue", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

async function uploadQueueWorker() {
  const worker = new Worker(
    "uploadQueue",
    async (job) => {
      try {
        const { images } = job.data;
        const Model = mongoose.model(images[0].modelName);
        for (const image of images) {
          const file = {
            buffer: Buffer.from(image.buffer.data),
            originalname: image.originalname,
            mimetype: image.mimetype,
          };
          const imageUrl = await uploadToS3(file);

          const updateData = {};
          updateData[image.field] = imageUrl;
          await Model.findByIdAndUpdate(image.id, { $set: updateData });
        }

        return images.map((image) => image.field);
      } catch (error) {
        console.log(error);
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

  worker.on("completed", async (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed with ${err.message}`);
  });
}

module.exports = {
  uploadQueue,
  uploadQueueWorker,
};
