const { upload } = require("../../utils/upload");
const pageController = require("../controllers/pages.controller");
const router = require("express").Router();

router.post("/add-page", upload, pageController.addPage);
router.get("/pages", pageController.getPages);
router.get("/page-by-type/:pageType", pageController.getPageByType);
router.get("/page/:id", pageController.getPageById);
router.delete("/page/:id", pageController.deletePage);

module.exports = router;
