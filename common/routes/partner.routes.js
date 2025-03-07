const partnerController = require("../controllers/partner.controller");
const router = require("express").Router();
const auth = require("../../middlewares/auth");
const { upload } = require("../../utils/upload");

router.post("/add-partner", auth, upload, partnerController.addPartner);
router.get("/partners", partnerController.getAllPartners);
router.get("/partner/:id", partnerController.partnerById);
router.put("/edit-partner/:id", auth, upload, partnerController.editPartner);
router.delete("/delete-partner/:id", auth, partnerController.deletePartner);

module.exports = router;
