const router = require("express").Router();
const { upload } = require("../../utils/upload");
const orderDetailsController = require("../controllers/userVisaOrder.controller");
const auth = require("../../middlewares/auth");

router.post("/create-visa-order", auth, orderDetailsController.createVisaOrder);
router.put("/edit-visa-order/:id", auth, orderDetailsController.editVisaOrder);
router.post("/user-visa-orders", auth, orderDetailsController.getVisaOrders);
router.get(
  "/user-visa-order/:visaOrderId",
  auth,
  orderDetailsController.getVisaOrderById
);
router.get(
  "/order-details-by-category/:visaOrderId",
  auth,
  orderDetailsController.getOrderDetailsByVisaOrder
);
router.post(
  "/add-order-details",
  auth,
  upload,
  orderDetailsController.addOrderDetails
);

router.get(
  "/order-detail/:id",
  auth,
  orderDetailsController.getOrderDetailsById
);

router.put(
  "/edit-order-details/:id",
  auth,
  upload,
  orderDetailsController.editOrderDetails
);

router.get("/visa-orders", auth, orderDetailsController.getAllVisaOrders);
router.put(
  "/edit-details-document/:id",
  auth,
  upload,
  orderDetailsController.editOrderDetailsImage
);
router.put(
  "/process-visa-order/:id",
  auth,
  upload,
  orderDetailsController.processVisaOrder
);
router.get(
  "/draft-visa-orders",
  auth,
  orderDetailsController.getDraftVisaOrders
);

module.exports = router;
