const subscriptionController = require("../controllers/subscription.controller");
const router = require("express").Router();

router.post("/add-subscription", subscriptionController.addSubscription);
router.get("/subscriptions", subscriptionController.getSubscriptions);
router.put("/edit-subscription/:id", subscriptionController.editSubscription);
router.delete(
  "/delete-subscription/:id",
  subscriptionController.deleteSubscription
);
router.get("/subscription/:id", subscriptionController.getSubscriptionById);

module.exports = router;
