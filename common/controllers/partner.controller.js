const Partner = require("../models/partner.model");
const { uploadQueue } = require("../../queue/upload.queue");
const paginate = require("../../utils/paginate");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async addPartner(req, res) {
    try {
      const data = req.body;
      data.travellersCount = data.travellersCount
        ? Number(data.travellersCount)
        : data.travellersCount;
      const image = req.files && req.files.image ? req.files.image[0] : null;

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.image = uploadImage.cdnUrl;
        }
      }

      const partner = await Partner.create(data);

      // const images = [];

      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: partner._id,
      //     modelName: "Partner",
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
        data: partner,
        success: true,
        message: "Partner added successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  async editPartner(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;

      const partner = await Partner.findByIdAndUpdate(id, data, { new: true });
      const images = [];

      if (image) {
        images.push({
          buffer: image.buffer,
          originalname: image.originalname,
          mimetype: image.mimetype,
          filename: image.filename,
          id: id,
          modelName: "Partner",
          field: "image",
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

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Partner not found",
        });
      }
      return res.status(200).json({
        data: partner,
        success: true,
        message: "Partner updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  async partnerById(req, res) {
    try {
      const { id } = req.params;
      const partner = await Partner.findById(id);
      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Partner not found",
        });
      }
      return res.status(200).json({
        data: partner,
        success: true,
        message: "Partner fetched successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  async getAllPartners(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      let totalItems = await Partner.countDocuments();
      let totalPages = Math.ceil(totalItems / take);
      let startNumber;
      let partners;
      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;
        partners = await Partner.find()
          .skip(skip)
          .limit(take)
          .sort({ createdAt: -1 });
        partners = partners.map((partner, index) => {
          return { ...partner.toObject(), s_no: startNumber + index };
        });
      } else {
        startNumber = 1;
        partners = await Partner.find().sort({ createdAt: -1 });
        partners = partners.map((partner, index) => {
          return { ...partner.toObject(), s_no: startNumber + index };
        });
      }
      return res.status(200).json({
        data: partners,
        success: true,
        message: "Partners fetched successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  async deletePartner(req, res) {
    try {
      const { id } = req.params;
      const partner = await Partner.findByIdAndDelete(id);
      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Partner not found",
        });
      }
      return res.status(200).json({
        data: partner,
        success: true,
        message: "Partner deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};
