const pageTypeController = require("../controllers/pageType.controller");
const router = require("express").Router();

router.post("/add-page-type", pageTypeController.addPageType);
router.get("/page-types", pageTypeController.getAllPageTypes);
router.get("/page-type/:type", pageTypeController.getPageByType);
router.put("/page-types/:type", pageTypeController.editPageType);
router.delete("/page-type/:type", pageTypeController.deletePageType);

module.exports = router;
