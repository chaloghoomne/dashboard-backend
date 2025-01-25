const Document = require("../models/document.model");
const VisaCategory = require("../models/visaCategory.model");
const uploadImages = require("../../utils/uploadImages");
const paginate = require("../../utils/paginate");
const uploadToS3 = require("../../utils/uploadToS3");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async addDocument(req, res) {
    try {
      let data = req.body;
      const image = req.files && req.files.icon ? req.files.icon[0] : null;

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.icon = uploadImage.cdnUrl;
        }
      }

      const newDocument = await Document.create(data);

      // let images = [];
      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: newDocument._id,
      //     modelName: "Document",
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

      return res.status(201).json({
        message: "Document added successfully",
        success: true,
        data: newDocument,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async editDocument(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const image = req.files && req.files.icon ? req.files.icon[0] : null;

      let url;

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.icon = uploadImage.cdnUrl;
        }
      }

      const document = await Document.findByIdAndUpdate(
        id,
        { $set: data },
        {
          new: true,
        }
      );

      if (!document) {
        return res.status(404).json({
          message: "Document not found",
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
      //     id: document._id,
      //     modelName: "Document",
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
        message: "Document updated successfully",
        success: true,
        data: document,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deleteDocument(req, res) {
    try {
      const { id } = req.params;

      const document = await Document.findByIdAndDelete(id);

      if (!document) {
        return res.status(404).json({
          message: "Document not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Document deleted successfully",
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

  async getDocuments(req, res) {
    try {
      let { page, limit } = req.query;
      let { skip, take } = paginate(page, limit);

      const totalItems = await Document.countDocuments();
      const totalPages = Math.ceil(totalItems / take);

      let documents;
      let startNumber;

      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;

        documents = await Document.find().skip(skip).limit(take).sort({
          createdAt: -1,
        });

        documents.map(async (document, index) => {
          return {
            ...document.toObject(),
            s_no: startNumber + index,
          };
        });
      } else {
        startNumber = 1;

        documents = await Document.find().sort({
          createdAt: -1,
        });

        documents.map(async (document, index) => {
          return {
            ...document.toObject(),
            s_no: startNumber + index,
          };
        });
      }

      return res.status(200).json({
        message: "Documents fetched successfully",
        success: true,
        data: documents,
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

  async getDocumentById(req, res) {
    try {
      const { id } = req.params;

      const document = await Document.findById(id);

      if (!document) {
        return res.status(404).json({
          message: "Document not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Document fetched successfully",
        success: true,
        data: document,
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
