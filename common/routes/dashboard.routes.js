const router = require("express").Router();
const dashboardController = require("../controllers/dashboard.controller");

router.get("/top-packages", dashboardController.getTopPackages);
router.get("/top-visa-categories", dashboardController.topVisaCategories);
router.get("/top-visa-order", dashboardController.maxAmountOrder);

module.exports = router;
