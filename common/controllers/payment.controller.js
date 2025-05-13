const Razorpay = require("razorpay");
const { v4: uuid } = require("uuid");
const Transaction = require("../models/transaction.model");
const crypto = require("crypto");
const User = require("../../user/models/user.model");
const paginate = require("../../utils/paginate");

// Validate required environment variables
const validateEnvironment = () => {
  const required = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
  const missing = required.filter(key => !process.env[key] || process.env[key].trim() === '');
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log("Environment validation successful");
  return true;
};

// Initialize Razorpay instance with proper error handling
let instance;
try {
  // Validate environment variables
  const isEnvValid = validateEnvironment();
  
  if (!isEnvValid) {
    throw new Error("Environment validation failed");
  }
  
  // Log key ID (first 4 chars only for security)
  const keyIdPreview = process.env.RAZORPAY_KEY_ID ? 
    `${process.env.RAZORPAY_KEY_ID.substring(0, 4)}...` : 
    'undefined';
  
  console.log(`Initializing Razorpay with Key ID: ${keyIdPreview}`);
  
  instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  
  console.log("Razorpay initialized successfully");
} catch (error) {
  console.error("Failed to initialize Razorpay:", error);
  console.log("Payment functionality will be unavailable");
}

// Validation helper functions
const validateCreateOrderRequest = (req) => {
  const { amount } = req.body;
  
  if (!amount) {
    return { valid: false, message: "Amount is required" };
  }
  
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, message: "Amount must be a positive number" };
  }
  
  return { valid: true };
};

const validateVerifyPaymentRequest = (req) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  
  if (!razorpay_payment_id) {
    return { valid: false, message: "Payment ID is required" };
  }
  
  if (!razorpay_order_id) {
    return { valid: false, message: "Order ID is required" };
  }
  
  if (!razorpay_signature) {
    return { valid: false, message: "Payment signature is required" };
  }
  
  return { valid: true };
};

// Debug helper function
const logPaymentDetails = (type, data) => {
  console.log(`============= ${type} =============`);
  console.log(JSON.stringify(data, null, 2));
  console.log(`============= END ${type} =============`);
};

module.exports = {
  async createOrder(req, res) {
    logPaymentDetails("CREATE ORDER REQUEST", {
      userId: req.user?.id,
      amount: req.body?.amount,
      purpose: req.body?.purpose,
      headers: Object.keys(req.headers),
      timestamp: new Date().toISOString()
    });
    
    try {
      // Check if Razorpay is properly initialized
      if (!instance) {
        console.error("Razorpay instance not initialized");
        return res.status(500).json({
          success: false,
          message: "Payment service unavailable. Please check server logs.",
          details: "Razorpay SDK initialization failed. Contact administrator."
        });
      }

      // Check environment variables again as a safety measure
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Missing Razorpay API keys in environment");
        return res.status(500).json({
          success: false,
          message: "Payment service misconfigured. Please contact support.",
        });
      }
      
      // Validate request using helper function
      const validation = validateCreateOrderRequest(req);
      if (!validation.valid) {
        console.log("Create order validation failed:", validation.message);
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      const userId = req.user.id;
      console.log("Creating order for user:", userId);
      
      // Create order options
      const amount = Math.round(req.body.amount * 100); // Convert to paise and ensure it's an integer
      const receiptId = uuid();
      const options = {
        amount: amount,
        currency: "INR",
        receipt: receiptId,
        notes: {
          userId: userId,
          purpose: req.body.purpose || "Payment",
          timestamp: new Date().toISOString()
        },
      };
      
      logPaymentDetails("RAZORPAY ORDER OPTIONS", {
        ...options,
        key_id_preview: process.env.RAZORPAY_KEY_ID.substring(0, 4) + '...',
      });
      
      // Create Razorpay order
      const order = await instance.orders.create(options);
      console.log("Razorpay order created:", order.id);
      
      // Create transaction record in the database
      try {
        const transaction = await Transaction.create({
          user: userId,
          orderId: order.id,
          receiptId: order.receipt,
          amount: order.amount,
          purpose: req.body.purpose || "Payment",
          status: "pending",
          created: new Date(),
        });
        
        console.log("Transaction record created:", transaction._id);
        
        return res.status(200).json({
          success: true,
          data: {
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            key: process.env.RAZORPAY_KEY_ID,
            transaction_id: transaction._id,
          },
          message: "Order placed successfully",
        });
      } catch (dbError) {
        console.error("Database error while creating transaction:", dbError);
        // Even if DB save fails, return the order to allow payment
        return res.status(200).json({
          success: true,
          data: {
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            key: process.env.RAZORPAY_KEY_ID,
          },
          message: "Order placed successfully (transaction tracking unavailable)",
        });
      }
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      
      // Handle specific Razorpay errors
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.error?.description || error.message,
          message: "Payment gateway error",
        });
      }
      
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to create payment order",
      });
    }
  },

  async verifyPayment(req, res) {
    logPaymentDetails("VERIFY PAYMENT REQUEST", {
      body: req.body,
      userId: req.user?.id,
      headers: Object.keys(req.headers),
      timestamp: new Date().toISOString()
    });
    
    try {
      // Check if Razorpay is properly initialized
      if (!instance) {
        console.error("Razorpay instance not initialized");
        return res.status(500).json({
          success: false,
          message: "Payment service unavailable",
          details: "Razorpay SDK initialization failed. Contact administrator."
        });
      }
      
      // Validate request using helper function
      const validation = validateVerifyPaymentRequest(req);
      if (!validation.valid) {
        console.log("Verify payment validation failed:", validation.message);
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      
      // Verify the payment signature
      console.log("Verifying payment signature");
      
      // Check if secret key is available
      if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error("Missing Razorpay secret key for signature verification");
        return res.status(500).json({
          success: false,
          message: "Payment verification failed due to server configuration issue",
        });
      }
      
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");
      
      // Log signature details (partial for security)
      console.log("Signature verification:", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        receivedSignature: razorpay_signature.substring(0, 6) + '...',
        generatedSignature: generatedSignature.substring(0, 6) + '...',
      });

      // Check if signature is valid
      const isSignatureValid = generatedSignature === razorpay_signature;
      console.log("Signature verification result:", isSignatureValid);
      
      if (!isSignatureValid) {
        console.error("Invalid payment signature");
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature. Payment verification failed.",
        });
      }

      // Find the transaction in our database
      console.log("Looking for transaction with order ID:", razorpay_order_id);
      const paymentDoc = await Transaction.find({
        orderId: razorpay_order_id,
        status: "pending",
      }).sort({ createdAt: -1 });

      if (paymentDoc.length === 0) {
        console.log("No matching transaction found");
        // Create transaction record if it doesn't exist (can happen if DB operation failed during order creation)
        try {
          // Try to fetch payment details from Razorpay to verify it exists
          const payment = await instance.payments.fetch(razorpay_payment_id);
          console.log("Payment found in Razorpay:", payment.id);
          
          // Create a new transaction record
          const transaction = await Transaction.create({
            user: req.user.id,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id, 
            amount: payment.amount,
            status: "success",
            paymentDate: new Date()
          });
          
          console.log("Created new transaction record:", transaction._id);
          
          // Update user balance
          const user = await User.findOneAndUpdate(
            { _id: req.user.id },
            { $inc: { balance: payment.amount / 100 } },
            { new: true }
          );
          
          return res.status(200).json({
            success: true,
            data: {
              payment_id: payment.id,
              order_id: razorpay_order_id,
              amount: payment.amount,
              transaction_id: transaction._id
            },
            message: "Payment verified and recorded successfully",
          });
        } catch (error) {
          console.error("Error verifying payment with Razorpay:", error);
          return res.status(400).json({
            success: false,
            message: "No matching payment record found",
            error: error.message
          });
        }
      }

      try {
        // Fetch payment details from Razorpay for verification
        console.log("Fetching payment details from Razorpay");
        const payment = await instance.payments.fetch(razorpay_payment_id);
        console.log("Payment status from Razorpay:", payment.status);
        
        // Update transaction with payment ID
        await Transaction.findOneAndUpdate(
          { orderId: razorpay_order_id },
          { 
            paymentId: razorpay_payment_id,
            paymentDetails: JSON.stringify(payment)
          },
          { new: true }
        );

        // Check for valid payment status
        if (payment.status === "authorized" || payment.status === "captured") {
          console.log("Payment is authorized/captured - updating transaction status");
          
          // Update transaction status to success
          const updatedPayment = await Transaction.findOneAndUpdate(
            { orderId: razorpay_order_id },
            { 
              status: "success",
              paymentDate: new Date()
            },
            { new: true }
          );

          console.log("Transaction updated successfully:", updatedPayment._id);
          
          // Update user balance
          const user = await User.findOneAndUpdate(
            { _id: req.user.id },
            { $inc: { balance: updatedPayment.amount / 100 } },
            { new: true }
          );

          console.log("User balance updated:", user._id);
          
          return res.status(200).json({
            success: true,
            data: {
              payment_id: payment.id,
              order_id: razorpay_order_id,
              amount: payment.amount,
              transaction_id: updatedPayment._id,
              status: payment.status
            },
            message: "Payment verified successfully",
          });
        } else if (payment.status === "failed") {
          console.log("Payment failed - updating transaction status");
          
          // Update transaction status to failed
          await Transaction.findOneAndUpdate(
            { orderId: razorpay_order_id },
            { 
              status: "failed",
              failureReason: payment.error_description || "Payment failed"
            },
            { new: true }
          );
          
          return res.status(400).json({
            success: false,
            data: {
              payment_id: payment.id,
              order_id: razorpay_order_id,
              error: payment.error_description
            },
            message: "Payment failed: " + (payment.error_description || "Unknown error"),
          });
        } else {
          console.log("Payment in unknown status:", payment.status);
          
          // Update transaction with current status
          await Transaction.findOneAndUpdate(
            { orderId: razorpay_order_id },
            { status: payment.status },
            { new: true }
          );
          
          return res.status(200).json({
            success: true,
            data: {
              payment_id: payment.id,
              order_id: razorpay_order_id,
              status: payment.status
            },
            message: `Payment is in ${payment.status} state`,
          });
        }
      } catch (error) {
        console.error("Error processing payment verification:", error);
        return res.status(500).json({
          success: false,
          error: error.message,
          message: "Failed to verify payment status",
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Internal server error during payment verification",
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
