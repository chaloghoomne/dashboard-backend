const VisaCategory = require("../models/visaCategory.model");
const paginate = require("../../utils/paginate");
const Package = require("../models/package.model");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async addVisaCategory(req, res) {
    try {
      const data = req.body;
      // Convert numeric fields to numbers if available
      console.log(data);
      data.price = data.price ? Number(data.price) : data.price;
      data.childPrice = data.price ? Number(data.childPrice) : data.childPrice;
      data.period = data.period ? Number(data.period) : data.period;
      data.stay = data.stay ? Number(data.stay) : data.stay;
      data.validity = data.validity ? Number(data.validity) : data.validity;
      data.insurance = data.insurance ? Number(data.insurance) : data.insurance;
      data.discount = data.discount ? Number(data.discount) : data.discount;
      data.insuranceAmount = data.insuranceAmount ? data.insuranceAmount : data.insuranceAmount;

      // Retrieve file uploads from the request
      const image = req.files && req.files.image ? req.files.image[0] : null;
      const icon = req.files && req.files.icon ? req.files.icon[0] : null;

      // If an image is provided, upload it to BunnyCDN
      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      // If an icon is provided, upload it to BunnyCDN
      if (icon) {
        const fileBuffer = icon.buffer;
        const fileName = `${Date.now()}-${icon.originalname}`;
        const uploadIcon = await uploadToBunny(fileBuffer, fileName);
        if (uploadIcon.success) {
          data.icon = uploadIcon.cdnUrl;
        }
      }

      const visaCategory = await VisaCategory.create(data);

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
      // Retrieve file uploads from the request
      const image = req.files && req.files.image ? req.files.image[0] : null;
      const icon = req.files && req.files.icon ? req.files.icon[0] : null;

      // Convert numeric fields to numbers if available
      data.price = data.price ? Number(data.price) : data.price;
      data.childPrice = data.price ? Number(data.childPrice) : data.childPrice;
      data.period = data.period ? Number(data.period) : data.period;
      data.validity = data.validity ? Number(data.validity) : data.validity;
      data.insuranceAmount = data.insuranceAmount ? data.insuranceAmount : data.insuranceAmount;

      const checkVisaCategory = await VisaCategory.findById(id);
      if (!checkVisaCategory) {
        return res.status(404).json({
          message: "Visa Category Not Found",
          success: false,
        });
      }

      // If an image is provided, upload it to BunnyCDN
      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      // If an icon is provided, upload it to BunnyCDN
      if (icon) {
        const fileBuffer = icon.buffer;
        const fileName = `${Date.now()}-${icon.originalname}`;
        const uploadIcon = await uploadToBunny(fileBuffer, fileName);
        if (uploadIcon.success) {
          data.icon = uploadIcon.cdnUrl;
        }
      }

      const visaCategory = await VisaCategory.findByIdAndUpdate(id, data, {
        new: true,
      });

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

      const totalItems = await VisaCategory.find().count();
      const totalPages = Math.ceil(totalItems / take);
      let startNumber;
      let visaCategories;

      if (page !== undefined && page !== null) {
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
          const pkg = visaCategory.package;
          let tourTypeName = null;
          if (pkg && pkg.tourTypes) {
            const tourType = pkg.tourTypes.find(
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
          const pkg = visaCategory.package;
          let tourTypeName = null;
          if (pkg && pkg.tourTypes) {
            const tourType = pkg.tourTypes.find(
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

      const pkg = await Package.findById(visaCategory.package);
      const currentDate = new Date();

      if (visaCategory.expressDays) {
        const expressDate = new Date(currentDate);
        expressDate.setDate(currentDate.getDate() + visaCategory.expressDays);
        visaCategory._doc.expressDate = expressDate.toDateString();
      }

      if (visaCategory.instantDays) {
        const instantDate = new Date(currentDate);
        instantDate.setDate(currentDate.getDate() + visaCategory.instantDays);
        visaCategory._doc.instantDate = instantDate.toDateString();
      }

      let tourTypeName = null;
      if (pkg && pkg.tourTypes) {
        const tourType = pkg.tourTypes.find(
          (type) =>
            type._id.toString() === visaCategory.tourType.toString()
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
      }).sort({ createdAt: -1 });

      const currentDate = new Date();
      visaCategories.forEach((category) => {
        if (category.expressDays) {
          const expressDate = new Date(currentDate);
          expressDate.setDate(currentDate.getDate() + category.expressDays);
          category._doc.expressDate = expressDate.toDateString();
        }
        if (category.instantDays) {
          const instantDate = new Date(currentDate);
          instantDate.setDate(currentDate.getDate() + category.instantDays);
          category._doc.instantDate = instantDate.toDateString();
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
