const careerController = require("../controllers/career.controller");
const { upload } = require("../../utils/upload");
const router = require("express").Router();

router.post("/add-career", upload, careerController.addCareer);
router.put("/edit-career/:id", upload, careerController.editCareer);
router.get("/career/:id", careerController.getCareerById);
router.get("/careers", careerController.getAllCareers);
router.delete("/career/:id", careerController.deleteCareer);

module.exports = router;
