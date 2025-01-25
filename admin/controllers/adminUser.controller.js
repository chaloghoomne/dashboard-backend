const User = require("../../user/models/user.model");
const paginate = require("../../utils/paginate");
const VisaOrder = require("../../common/models/visaOrder.model");

module.exports = {
  async getAllUsers(req, res) {
    try {
      const { page, limit, query } = req.query;
      const { skip, take } = paginate(page, limit);

      let searchQuery = {};

      if (query === "blocked") {
        searchQuery = { isBlocked: true };
      }

      let totalItems = await User.countDocuments(searchQuery);
      let totalPages = Math.ceil(totalItems / take);
      let startNumber;
      let users;
      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;
        users = await User.find(searchQuery)
          .skip(skip)
          .limit(take)
          .select("-password")
          .sort({ createdAt: -1 });
        users = users.map((user, index) => {
          return { ...user.toObject(), s_no: startNumber + index };
        });
      } else {
        startNumber = 1;
        users = await User.find(searchQuery).sort({ createdAt: -1 });
        users = users.map((user, index) => {
          return { ...user.toObject(), s_no: startNumber + index };
        });
      }

      return res.status(200).json({
        data: users,
        message: "Users fetched successfully",
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

  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select("-password");

      return res.status(200).json({
        data: user,
        message: "User fetched successfully",
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

  async deleteUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);

      await VisaOrder.deleteMany({ user: id });

      return res.status(200).json({
        message: "User deleted successfully",
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

  async blockUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      user.isBlocked = !user.isBlocked;

      await user.save();

      return res.status(200).json({
        message: `User ${
          user.isBlocked ? "blocked" : "unblocked"
        } successfully`,
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

  async suspendUser(req, res) {
    try {
      const { id } = req.params;
      const { suspendedUntill } = req.body;

      const user = await User.findById(id);

      if (!user) {
        return res.status(400).json({
          message: "User not found",
          success: false,
        });
      }

      user.isSuspended = true;
      user.suspendedUntill = suspendedUntill;

      return res.status(200).json({
        message: "User suspended successfully",
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

  async suspendedUsers(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      const totalItems = await User.countDocuments({ isSuspended: true });
      const totalPages = Math.ceil(totalItems / take);
      let startNumber;

      let users;
      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take + 1;
        users = await User.find({ isSuspended: true })
          .skip(skip)
          .limit(take)
          .select("-password")
          .sort({ createdAt: -1 });
        users = users.map((user, index) => {
          return { ...user.toObject(), s_no: startNumber + index };
        });
      } else {
        startNumber = 1;
        users = await User.find({ isSuspended: true })
          .select("-password")
          .sort({ createdAt: -1 });
        users = users.map((user, index) => {
          return { ...user.toObject(), s_no: startNumber + index };
        });
      }

      return res.status(200).json({
        data: users,
        message: "Suspended users fetched successfully",
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
};
