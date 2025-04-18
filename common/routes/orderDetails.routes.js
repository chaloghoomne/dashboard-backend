const router = require("express").Router();
const { upload } = require("../../utils/upload");
const orderDetailsController = require("../controllers/userVisaOrder.controller");
const auth = require("../../middlewares/auth");

router.post("/create-visa-order", orderDetailsController.createVisaOrder);
router.put("/edit-visa-order/:id", auth, orderDetailsController.editVisaOrder);


router.post("/user-visa-orders", orderDetailsController.getVisaOrders);
router.get(
  "/user-visa-order/:visaOrderId",
  orderDetailsController.getVisaOrderById
);
router.get(
  "/order-details-by-category/:visaOrderId",
  orderDetailsController.getOrderDetailsByVisaOrder
);
router.post(
  "/add-order-details",
  upload,
  orderDetailsController.addOrderDetails
);

router.get(
  "/order-detail/:id",
  orderDetailsController.getOrderDetailsById
);

router.put(
  "/edit-order-details/:id",
  auth,
  upload,
  orderDetailsController.editOrderDetails
);
router.put("/edit-order-details-v2/:id", auth,upload, orderDetailsController.editOrderDetailsV2);

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
