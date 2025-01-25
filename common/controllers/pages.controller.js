const Pages = require("../models/pages.model");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");

module.exports = {
  async addPage(req, res) {
    try {
      let data = req.body;
      const image = req.files && req.files.image ? req.files.image[0] : null;
      if (data.sections) {
        data.sections = JSON.parse(data.sections);
      }

      // Find the existing page by title or pageType
      const existingPage = await Pages.findOne({
        $or: [{ title: data.title }, { pageType: data.pageType }],
      });

      if (image) {
        const fileBuffer = image.buffer;
        const fileName = `${Date.now()}-${image.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.imageUrl = uploadImage.cdnUrl;
        }
      }

      let page;

      if (existingPage) {
        // Update the existing page with new data
        page = await Pages.findByIdAndUpdate(
          existingPage._id,
          { $set: data },
          { new: true }
        );
      } else {
        // Create a new page
        page = await Pages.create(data);
      }

      // const images = [];

      // if (image) {
      //   images.push({
      //     buffer: image.buffer,
      //     originalname: image.originalname,
      //     mimetype: image.mimetype,
      //     filename: image.filename,
      //     id: page._id,
      //     modelName: "Pages",
      //     field: "imageUrl",
      //   });
      // }

      // if (images.length > 0) {
      //   uploadImages(images)
      //     .then((results) => {
      //       console.log("All uploads completed", results);
      //     })
      //     .catch((error) => {
      //       console.error("Error in batch upload:", error);
      //     });
      // }

      return res.status(200).json({
        message: "Page added or updated successfully",
        data: page,
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

  async getPages(req, res) {
    try {
      const pages = await Pages.find();

      return res.status(200).json({
        message: "Data fetched successfully",
        data: pages,
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

  async getPageByType(req, res) {
    try {
      const { pageType } = req.params;
      const page = await Pages.findOne({ pageType });

      if (!page) {
        return res.status(404).json({
          message: "Page not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Page fetched successfully",
        data: page,
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

  async getPageById(req, res) {
    try {
      const { id } = req.params;
      const page = await Pages.findById(id);

      if (!page) {
        return res.status(404).json({
          message: "Page not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Page fetched successfully",
        data: page,
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

  async deletePage(req, res) {
    try {
      const { id } = req.params;
      const page = await Pages.findByIdAndDelete(id);

      if (!page) {
        return res.status(404).json({
          message: "Page not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Page deleted successfully",
        data: page,
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
