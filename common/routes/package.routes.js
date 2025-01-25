const { upload } = require("../../utils/upload");
const packageController = require("../controllers/package.controller");
const router = require("express").Router();

router.post("/add-place", upload, packageController.addPackage);
router.get("/places", packageController.getPackages);
router.get("/place/:id", packageController.getPackageById);
router.put("/rank-package/:id", packageController.rankPackage);
router.put("/edit-place/:id", upload, packageController.editPackage);
router.delete("/delete-place/:id", packageController.deletePackage);
router.put("/edit-package-image/:id", upload, packageController.editImage);
router.put("/document-image/:id", upload, packageController.editDocumentImage);

module.exports = router;
