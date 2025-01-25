const Razorpay = require("razorpay");
const { v4: uuid } = require("uuid");
const Transaction = require("../models/transaction.model");
const crypto = require("crypto");
const User = require("../../user/models/user.model");
const paginate = require("../../utils/paginate");

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const options = {
        amount: req.body.amount * 100,
        currency: "INR",
        receipt: uuid(),
      };
      const order = await instance.orders.create(options);
      const transaction = await Transaction.create({
        user: userId,
        orderId: order.id,
        receiptId: order.receipt,
        amount: order.amount,
      });
      return res.status(200).json({
        success: true,
        data: order,
        message: "Order placed successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async verifyPayment(req, res) {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        req.body;

      const paymentDoc = await Transaction.find({
        $and: [{ user: req.user.id }, { status: "pending" }],
      }).sort({ createdAt: -1 });

      if (paymentDoc.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No payment is started",
        });
      }

      console.log(paymentDoc[0].orderId);
      const payment = await instance.orders.fetchPayments(
        paymentDoc[0].orderId
      );
      if (payment.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }

      if (payment.items[0].status === "authorized") {
        const updatedPayment = await Transaction.findOneAndUpdate(
          { orderId: paymentDoc[0].orderId },
          { status: "success" },
          { new: true }
        );

        const user = await User.findOneAndUpdate(
          { _id: req.user.id },
          { $inc: { balance: updatedPayment.amount / 100 } },
          { new: true }
        );

        return res.status(200).json({
          data: payment,
          success: true,
          message: "Payment verified",
        });
      }

      res.status(200).json({
        data: payment,
        success: true,
        message: "Payment verified successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async refundPayment(req, res) {
    try {
      const data = req.body;

      let url = `https://api.razorpay.com/v1/payments/${data.paymentId}/refund`;

      let request = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
          ).toString("base64")}`,
        },
      });

      let response = await request.json();

      if (response.error) {
        return res.status(500).json({
          error: response.error.description,
          message: "Internal Server Error",
          success: false,
        });
      }

      await Transaction.findOneAndUpdate(
        { paymentId: data.transactionId },
        { status: "refunded" },
        { new: true }
      );

      return res.status(200).json({
        data: response,
        success: true,
        message: "The amount will be refunded in 5-7 working days",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async requestRefund(req, res) {
    try {
      const { transactionId } = req.params;

      const transaction = await Transaction.findById(
        transactionId,
        {
          $set: { refundRequest: true },
        },
        { new: true }
      );

      return res.status(200).json({
        data: transaction,
        success: true,
        message: "Refund request sent successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async userTransactions(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);
      const userId = req.user.id;
      const totalItems = await Transaction.countDocuments({ user: userId });
      const totalPages = Math.ceil(totalItems / take);
      const startNumber = (page ? (page - 1) * take : 0) + 1;

      let transactions = await Transaction.find({ user: userId })
        .skip(skip)
        .limit(take)
        .sort({ createdAt: -1 });

      transactions = transactions.map((item, index) => ({
        ...item._doc,
        s_no: startNumber + index,
      }));

      return res.status(200).json({
        data: transactions,
        success: true,
        message: "Transactions fetched successfully",
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

  async getAllTransactions(req, res) {
    try {
      const { status, page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      let query = {};

      if (status) {
        query.status = status;
      }

      const totalItems = await Transaction.countDocuments(query);
      const totalPages = Math.ceil(totalItems / take);
      const startNumber = (page ? (page - 1) * take : 0) + 1;

      let transactions = await Transaction.find(query)
        .skip(skip)
        .limit(take)
        .sort({ createdAt: -1 });

      transactions = transactions.map((item, index) => ({
        ...item._doc,
        s_no: startNumber + index,
      }));

      return res.status(200).json({
        data: transactions,
        success: true,
        message: "Transactions fetched successfully",
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

  async userTransactionForAdmin(req, res) {
    try {
      const userId = req.params.userId;
      const { status, page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      let query = {};
      query.user = userId;

      if (status) {
        query.status = status;
      }

      const totalItems = await Transaction.countDocuments(query);
      const totalPages = Math.ceil(totalItems / take);
      const startNumber = (page ? (page - 1) * take : 0) + 1;

      let transactions = await Transaction.find(query)
        .skip(skip)
        .limit(take)
        .sort({ createdAt: -1 });

      transactions = transactions.map((item, index) => ({
        ...item._doc,
        s_no: startNumber + index,
      }));

      return res.status(200).json({
        data: transactions,
        success: true,
        message: "Transactions fetched successfully",
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
