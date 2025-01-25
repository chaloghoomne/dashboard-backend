const Package = require("../models/package.model");
const VisaCategory = require("../models/visaCategory.model");
const VisaOrder = require("../models/visaOrder.model");

module.exports = {
  async getTopPackages(req, res) {
    try {
      // Aggregate Visa Orders to count the number of orders for each visaCategory
      const topVisaCategories = await VisaOrder.aggregate([
        {
          $group: {
            _id: "$visaCategory", // Group by visaCategory (VisaCategory ID)
            count: { $sum: 1 }, // Count the number of orders
          },
        },
        {
          $sort: { count: -1 }, // Sort by count in descending order
        },
        {
          $limit: 5, // Limit to top 5 results
        },
      ]);

      // Fetch the VisaCategory and associated Package details for each top visaCategory
      const topPackagesDetails = await Promise.all(
        topVisaCategories.map(async (visaCategoryData) => {
          const visaCategory = await VisaCategory.findById(
            visaCategoryData._id
          ).populate("package");

          if (visaCategory && visaCategory.package) {
            return {
              package: visaCategory.package,
              orderCount: visaCategoryData.count,
            };
          }
          return null;
        })
      );

      // Filter out any null results
      const validPackagesDetails = topPackagesDetails.filter(
        (pkg) => pkg !== null
      );

      return res.status(200).json({
        data: validPackagesDetails,
        message: "Top 5 packages fetched successfully",
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

  async topVisaCategories(req, res) {
    try {
      const topVisaCategories = await VisaOrder.aggregate([
        {
          $group: {
            _id: "$visaCategory",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
      ]);

      const visaCategoryIds = topVisaCategories.map((data) => data._id);

      const visaCategories = await VisaCategory.find({
        _id: { $in: visaCategoryIds },
      });

      return res.status(200).json({
        data: visaCategories,
        message: "Top 5 visa categories fetched successfully",
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

  async maxAmountOrder(req, res) {
    try {
      const maxAmountOrder = await VisaOrder.findOne()
        .sort({ totalAmount: -1 })
        .limit(1);

      return res.status(200).json({
        data: maxAmountOrder,
        message: "Max amount order fetched successfully",
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
