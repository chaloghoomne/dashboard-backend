const PageType = require("../models/pageType.model");
const paginate = require("../../utils/paginate");

module.exports = {
  async addPageType(req, res) {
    try {
      const data = req.body;

      const checkExistingPage = await PageType.findOne({
        type: data.type,
      });

      if (checkExistingPage) {
        return res.status(400).json({
          message: "Page Type Already Exists",
          success: false,
        });
      }

      const newPageType = await PageType.create(data);

      return res.status(201).json({
        message: "Page Type Added Successfully",
        data: newPageType,
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

  async editPageType(req, res) {
    try {
      const data = req.body;
      const type = req.params.type;
      let updatedPageType;
      updatedPageType = await PageType.findOneAndUpdate({ type: type }, data, {
        new: true,
      });

      if (!updatedPageType) {
        updatedPageType = await PageType.create({ ...data, type: type });
      }

      return res.status(200).json({
        message: "Page Type Updated Successfully",
        data: updatedPageType,
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
      const type = req.params.type;

      const pageType = await PageType.findOne({ type: type });

      return res.status(200).json({
        message: "Page Type Fetched Successfully",
        data: pageType,
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

  async getAllPageTypes(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);
      let startNumber;
      const totalItems = await PageType.countDocuments();
      const totalPages = Math.ceil(totalItems / take);
      let pageTypes;

      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;
        pageTypes = await PageType.find()
          .skip(skip)
          .limit(take)
          .sort({ createdAt: -1 });
        // users = users.map((user, index) => {
        //   return { ...user.toObject(), s_no: startNumber + index };
        // });
        pageTypes = pageTypes.map((pageType, index) => {
          return { ...pageType.toObject(), s_no: startNumber + index };
        });
      } else {
        pageTypes = await PageType.find().sort({ createdAt: -1 });
        pageTypes = pageTypes.map((pageType, index) => {
          return { ...pageType.toObject(), s_no: startNumber + index };
        });
      }

      return res.status(200).json({
        message: "Page Types Fetched Successfully",
        data: pageTypes,
        success: true,
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

  async deletePageType(req, res) {
    try {
      const type = req.params.type;

      const deletedPageType = await PageType.findOneAndDelete({ type: type });

      return res.status(200).json({
        message: "Page Type Deleted Successfully",
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
