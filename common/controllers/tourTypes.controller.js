const paginate = require("../../utils/paginate");
const uploadImages = require("../../utils/uploadImages");
const TourType = require("../models/tourTypes.model");
const uploadToS3 = require("../../utils/uploadToS3");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async addTourType(req, res) {
    try {
      let data = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      const tourType = await TourType.create(data);

      // let images = [];
      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: tourType._id,
      //     modelName: "TourType",
      //     field: "image",
      //   });
      // }

      // if (images.length > 0) {
      //   uploadImages(images)
      //     .then((results) => {
      //       console.log("All uploads completed", results);
      //       // Handle the results as needed
      //     })
      //     .catch((error) => {
      //       console.error("Error in batch upload:", error);
      //     });
      // }

      return res.status(201).json({
        message: "Tour Type added successfully",
        success: true,
        data: tourType,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async editTourType(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      const tourType = await TourType.findByIdAndUpdate(
        id,
        { $set: data },
        {
          new: true,
        }
      );

      if (!tourType) {
        return res.status(404).json({
          message: "Tour Type not found",
          success: false,
        });
      }

      // let images = [];

      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: tourType._id,
      //     modelName: "TourType",
      //     field: "image",
      //   });
      // }

      // if (images.length > 0) {
      //   uploadImages(images)
      //     .then((results) => {
      //       console.log("All uploads completed", results);
      //       // Handle the results as needed
      //     })
      //     .catch((error) => {
      //       console.error("Error in batch upload:", error);
      //     });
      // }

      return res.status(200).json({
        message: "Tour Type updated successfully",
        success: true,
        data: tourType,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deleteTourType(req, res) {
    try {
      const { id } = req.params;

      const tourType = await TourType.findByIdAndDelete(id);

      if (!tourType) {
        return res.status(404).json({
          message: "Tour Type not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Tour Type deleted successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getTourTypes(req, res) {
    try {
      let { page, limit } = req.query;
      let { skip, take } = paginate(page, limit);

      const totalItems = await TourType.countDocuments();
      const totalPages = Math.ceil(totalItems / take);

      let tourTypes;
      let startNumber;

      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;

        tourTypes = await TourType.find().skip(skip).limit(take).sort({
          createdAt: -1,
        });

        tourTypes.map((tourType, index) => {
          return {
            ...tourType.toObject(),
            s_no: startNumber + index,
          };
        });
      } else {
        startNumber = 1;

        tourTypes = await TourType.find().sort({
          createdAt: -1,
        });

        tourTypes.map((tourType, index) => {
          return {
            ...tourType.toObject(),
            s_no: startNumber + index,
          };
        });
      }

      return res.status(200).json({
        message: "Tour Types fetched successfully",
        success: true,
        data: tourTypes,
        totalPages,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getTourTypeById(req, res) {
    try {
      const { id } = req.params;

      const tourType = await TourType.findById(id);

      if (!tourType) {
        return res.status(404).json({
          message: "Tour Type not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Tour Type fetched successfully",
        success: true,
        data: tourType,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },
};
