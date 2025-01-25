const startMultipartUpload = require("./chunkUpload");
const mongoose = require("mongoose");

const uploadImages = async (images) => {
  const uploadPromises = images.map(async (image) => {
    try {
      const finalUrl = await startMultipartUpload(image);
      const Model = mongoose.model(image.modelName);

      const updateData = {};
      updateData[image.field] = finalUrl;
      await Model.findByIdAndUpdate(image.id, { $set: updateData });

      return { success: true, url: finalUrl, field: image.field };
    } catch (error) {
      console.error(`Error uploading image ${image.originalname}:`, error);
      return { success: false, error, field: image.field };
    }
  });

  return Promise.all(uploadPromises);
};

module.exports = uploadImages;
