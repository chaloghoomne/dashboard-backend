const tourTypesController = require("../controllers/tourTypes.controller");
const router = require("express").Router();
const { upload } = require("../../utils/upload");

router.post("/add-tour-type", upload, tourTypesController.addTourType);
router.get("/tour-types", tourTypesController.getTourTypes);
router.get("/tour-type/:id", tourTypesController.getTourTypeById);
router.put("/edit-tour-type/:id", upload, tourTypesController.editTourType);
router.delete("/delete-tour-type/:id", tourTypesController.deleteTourType);

module.exports = router;
