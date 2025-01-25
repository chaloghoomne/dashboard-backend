const Subscription = require("../models/subscription.model");
const paginate = require("../..//utils/paginate");
const { notificationQueue } = require("../../queue/notification.queue");

module.exports = {
  async addSubscription(req, res) {
    try {
      const { email } = req.body;
      const newSubscription = new Subscription({ email });
      await newSubscription.save();

      const jobId = `notification-${Date.now()}`;
      await notificationQueue.add(jobId, {
        title: "New Subscription",
        body: "A new subscription has been added. Check it out!",
        image: null,
        adminId: true,
      });

      res
        .status(201)
        .json({ message: "Subscription added successfully", success: true });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getSubscriptions(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      const totalItems = await Subscription.countDocuments();
      const totalPages = Math.ceil(totalItems / take);

      let startNumber;
      let subscription;

      if (page && page !== undefined && page !== null) {
        startNumber = (page - 1) * take;

        subscription = await Subscription.find()
          .skip(skip)
          .limit(take)
          .sort({ createdAt: -1 });

        subscription = subscription.map((item, index) => {
          return {
            ...item.toObject(),
            s_no: startNumber + index + 1,
          };
        });
      } else {
        startNumber = 1;

        subscription = await Subscription.find().sort({ createdAt: -1 });

        subscription = subscription.map((item, index) => {
          return {
            ...item.toObject(),
            s_no: startNumber + index + 1,
          };
        });
      }
      console.log("ASdasd", subscription);
      return res.status(200).json({
        data: subscription,
        message: "Subscriptions Fetched Successfully",
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

  async getSubscriptionById(req, res) {
    try {
      const { id } = req.params;
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        return res.status(404).json({
          message: "Subscription not found",
          success: false,
        });
      }
      return res.status(200).json({
        data: subscription,
        message: "Subscription Fetched Successfully",
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

  async editSubscription(req, res) {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const subscription = await Subscription.findByIdAndUpdate(
        id,
        { email },
        { new: true }
      );
      if (!subscription) {
        return res.status(404).json({
          message: "Subscription not found",
          success: false,
        });
      }
      return res.status(200).json({
        data: subscription,
        message: "Subscription Updated Successfully",
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

  async deleteSubscription(req, res) {
    try {
      const { id } = req.params;
      const subscription = await Subscription.findByIdAndDelete(id);
      if (!subscription) {
        return res.status(404).json({
          message: "Subscription not found",
          success: false,
        });
      }
      return res.status(200).json({
        message: "Subscription Deleted Successfully",
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
