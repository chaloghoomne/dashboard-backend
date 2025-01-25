const router = require("express").Router();
const paymentController = require("../controllers/payment.controller");
const auth = require("../..//middlewares/auth");

router.post("/create-order", auth, paymentController.createOrder);
router.post("/verify-payment", auth, paymentController.verifyPayment);
router.post("/refund-payment", paymentController.refundPayment);
router.get("/transactions", paymentController.getAllTransactions);
router.get("/user-transactions", auth, paymentController.userTransactions);
router.put(
  "/request-refund/:transactionId",
  auth,
  paymentController.requestRefund
);
router.get(
  "/admin-users-transactions/:userId",
  paymentController.userTransactionForAdmin
);

module.exports = router;
