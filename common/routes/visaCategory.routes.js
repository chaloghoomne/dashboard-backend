const router = require("express").Router();
const visaCategoryController = require("../controllers/visaCategory.controller");
const { upload } = require("../../utils/upload");

router.post(
  "/add-visa-category",
  upload,
  visaCategoryController.addVisaCategory
);
router.get("/visa-categories", visaCategoryController.getAllVisaCategory);
router.get("/visa-category/:id", visaCategoryController.getVisaCategoryById);
router.put(
  "/edit-visa-category/:id",
  upload,
  visaCategoryController.editVisaCategory
);
router.delete(
  "/delete-visa-category/:id",
  visaCategoryController.deleteVisaCategory
);
router.post(
  "/visa-category-by-package",
  visaCategoryController.getVisaCategoryByPackage
);

module.exports = router;
