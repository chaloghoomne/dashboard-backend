const VisaCategory = require("../models/visaCategory.model");
const paginate = require("../../utils/paginate");
const { uploadQueue } = require("../../queue/upload.queue");
const uploadImages = require("../../utils/uploadImages");
const Package = require("../models/package.model");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async addVisaCategory(req, res) {
    try {
      const data = req.body;
      data.price = data.price ? Number(data.price) : data.price;
      data.childPrice = data.price ? Number(data.childPrice) : data.childPrice;
      data.period = data.period ? Number(data.period) : data.period;
      data.stay = data.stay ? Number(data.stay) : data.stay;
      data.validity = data.validity ? Number(data.validity) : data.validity;
      data.insurance = data.insurance ? Number(data.insurance) : data.insurance;
      data.discount = data.discount ? Number(data.discount) : data.discount;
      data.insuranceAmount = data.insuranceAmount
        ? data.insuranceAmount
        : data.insuranceAmount;

      const image = req.files && req.files.image ? req.files.image[0] : null;
      const icon = req.files && req.files.icon ? req.files.icon[0] : null;

      const visaCategory = await VisaCategory.create(data);

      const images = [];

      if (image) {
        images.push({
          buffer: image.buffer,
          originalname: image.originalname,
          mimetype: image.mimetype,
          filename: image.filename,
          id: visaCategory._id,
          modelName: "VisaCategory",
          field: "image",
        });
      }

      if (icon) {
        images.push({
          buffer: image.buffer,
          originalname: image.originalname,
          mimetype: image.mimetype,
          filename: image.filename,
          id: visaCategory._id,
          modelName: "VisaCategory",
          field: "icon",
        });
      }

      if (images.length > 0) {
        uploadImages(images)
          .then((results) => {
            console.log("All uploads completed", results);
            // Handle the results as needed
          })
          .catch((error) => {
            console.error("Error in batch upload:", error);
          });
      }
      return res.status(201).json({
        data: visaCategory,
        message: "Visa Category Added Successfully",
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

  async editVisaCategory(req, res) {
    try {
      const { id } = req.params;

      const data = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;
      const icon = req.files && req.files.icon ? req.files.icon[0] : null;

      data.price = data.price ? Number(data.price) : data.price;
      data.childPrice = data.price ? Number(data.childPrice) : data.childPrice;
      data.period = data.period ? Number(data.period) : data.period;
      data.validity = data.validity ? Number(data.validity) : data.validity;
      data.insuranceAmount = data.insuranceAmount
        ? data.insuranceAmount
        : data.insuranceAmount;

      const checkVisaCategory = await VisaCategory.findById(id);

      if (!checkVisaCategory) {
        return res.status(404).json({
          message: "Visa Category Not Found",
          success: false,
        });
      }

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      if (icon) {
        const fileBuffer = icon.buffer;
        const fileName = `${Date.now()}-${icon.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.icon = uploadImage.cdnUrl;
        }
      }

      const visaCategory = await VisaCategory.findByIdAndUpdate(id, data, {
        new: true,
      });

      // const images = [];

      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: visaCategory._id,
      //     modelName: "VisaCategory",
      //     field: "image",
      //   });
      // }

      // if (icon) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: visaCategory._id,
      //     modelName: "VisaCategory",
      //     field: "icon",
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
        data: visaCategory,
        message: "Visa Category Updated Successfully",
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

  async getAllVisaCategory(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      const totalItems = await VisaCategory.countDocuments();
      const totalPages = Math.ceil(totalItems / take);
      let startNumber;
      let visaCategories;

      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take;
        visaCategories = await VisaCategory.find()
          .populate({
            path: "package",
            populate: {
              path: "tourTypes",
              model: "TourType",
            },
          })
          .skip(skip)
          .limit(take)
          .sort({ createdAt: -1 });
        visaCategories = visaCategories.map((visaCategory, index) => {
          const package = visaCategory.package;
          let tourTypeName = null;
          if (package && package.tourTypes) {
            const tourType = package.tourTypes.find(
              (type) => type._id.toString() === visaCategory.tourType.toString()
            );
            tourTypeName = tourType ? tourType.name : null;
          }

          return {
            ...visaCategory.toObject(),
            s_no: startNumber + index + 1,
            tourType: tourTypeName,
          };
        });
      } else {
        startNumber = 1;
        visaCategories = await VisaCategory.find()
          .populate({
            path: "package",
            populate: {
              path: "tourTypes",
              model: "TourType",
            },
          })
          .sort({ createdAt: -1 });
        visaCategories = visaCategories.map((visaCategory, index) => {
          // Ensure package is defined
          const package = visaCategory.package;

          let tourTypeName = null;
          if (package && package.tourTypes) {
            const tourType = package.tourTypes.find(
              (type) => type._id.toString() === visaCategory.tourType.toString()
            );
            tourTypeName = tourType ? tourType.name : null;
          }

          return {
            ...visaCategory.toObject(),
            s_no: startNumber + index,
            tourType: tourTypeName,
          };
        });
      }

      return res.status(200).json({
        data: visaCategories,
        message: "Visa Category Fetched Successfully",
        success: true,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching visa categories:", error);
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getVisaCategoryById(req, res) {
    try {
      const { id } = req.params;
      const visaCategory = await VisaCategory.findById(id);

      if (!visaCategory) {
        return res.status(404).json({
          message: "Visa Category not found",
          success: false,
        });
      }

      const package = await Package.findById(visaCategory.package);

      const currentDate = new Date();
      if (visaCategory.expressDays) {
        const expressDate = new Date(currentDate);
        expressDate.setDate(currentDate.getDate() + visaCategory.expressDays);
        visaCategory._doc.expressDate = new Date(expressDate).toDateString();
      }

      if (visaCategory.instantDays) {
        const instantDate = new Date(currentDate);
        instantDate.setDate(currentDate.getDate() + visaCategory.instantDays);
        visaCategory._doc.instantDate = new Date(instantDate).toDateString();
      }

      let tourTypeName = null;
      if (package && package.tourTypes) {
        const tourType = package.tourTypes.find(
          (type) => type._id.toString() === visaCategory.tourType.toString()
        );
        tourTypeName = tourType ? tourType.name : null;
      }

      return res.status(200).json({
        data: {
          ...visaCategory.toObject(),
          tourTypeName,
        },
        message: "Visa Category Fetched Successfully",
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

  async deleteVisaCategory(req, res) {
    try {
      const { id } = req.params;
      const visaCategory = await VisaCategory.findByIdAndDelete(id);

      return res.status(200).json({
        data: visaCategory,
        message: "Visa Category Deleted Successfully",
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

  async getVisaCategoryByPackage(req, res) {
    try {
      const { package: packageId, tourType } = req.body;
      const visaCategories = await VisaCategory.find({
        $and: [
          packageId ? { package: packageId } : {},
          tourType ? { tourType } : {},
        ],
      }).sort({
        createdAt: -1,
      });

      const currentDate = new Date();
      visaCategories.forEach((category) => {
        if (category.expressDays) {
          const expressDate = new Date(currentDate);
          expressDate.setDate(currentDate.getDate() + category.expressDays);
          category._doc.expressDate = new Date(expressDate).toDateString();
        }
        if (category.instantDays) {
          const instantDate = new Date(currentDate);
          instantDate.setDate(currentDate.getDate() + category.instantDays);
          category._doc.instantDate = new Date(instantDate).toDateString();
        }
      });

      return res.status(200).json({
        data: visaCategories,
        message: "Visa Category Fetched Successfully",
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
};
