const router = require("express").Router();
const paymentController = require("../controllers/payment.controller");
const auth = require("../../middlewares/auth");

// Utility middleware for validation and error handling
const validateRequest = (validator) => {
  return (req, res, next) => {
    try {
      const validation = validator(req);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }
      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }
  };
};

// Error handling middleware
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Route error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    });
  };
};

// Order creation and payment verification
router.post(
  "/create-order", 
  auth, 
  asyncHandler(paymentController.createOrder)
);

router.post(
  "/verify-payment", 
  auth, 
  asyncHandler(paymentController.verifyPayment)
);

// Refund related routes
router.post(
  "/refund-payment", 
  auth, // Add auth middleware for security
  asyncHandler(paymentController.refundPayment)
);

router.put(
  "/request-refund/:transactionId",
  auth,
  asyncHandler(paymentController.requestRefund)
);

// Transaction retrieval routes
router.get(
  "/transactions", 
  auth, // Add auth middleware for security
  asyncHandler(paymentController.getAllTransactions)
);

router.get(
  "/user-transactions", 
  auth, 
  asyncHandler(paymentController.userTransactions)
);

router.get(
  "/admin-users-transactions/:userId",
  auth, // Add auth middleware for security
  asyncHandler(paymentController.userTransactionForAdmin)
);

// Check payment status (optional)
router.get(
  "/payment-status/:orderId",
  auth,
  asyncHandler(async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required",
        });
      }
      
      const transaction = await require("../models/transaction.model").findOne({
        orderId: orderId,
      });
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          status: transaction.status,
          orderId: transaction.orderId,
          amount: transaction.amount,
          paymentId: transaction.paymentId,
        },
        message: "Transaction status retrieved successfully",
      });
    } catch (error) {
      console.error("Error retrieving payment status:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving payment status",
        error: error.message,
      });
    }
  })
);

module.exports = router;
