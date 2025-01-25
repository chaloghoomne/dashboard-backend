const aboutController = require("../controllers/about.controller");
const router = require("express").Router();
const { upload } = require("../../utils/upload");

router.post("/about", upload, aboutController.addAbout);
router.get("/about", aboutController.getAbout);
router.delete("/about/:id", aboutController.deleteAbout);

module.exports = router;
