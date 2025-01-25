const packageNoteController = require("../controllers/packageNotes.controller");
const router = require("express").Router();

router.post("/add-package-note", packageNoteController.addPackageNotes);
router.get("/package-notes", packageNoteController.getPackageNotes);
router.get("/package-notes/:id", packageNoteController.getPackageNoteById);
router.put("/edit-package-note/:id", packageNoteController.editPackageNote);
router.delete("/package-notes/:id", packageNoteController.deletePackageNotes);
router.get(
  "/package-note-by-type/:type",
  packageNoteController.getPackageNotesByType
);

module.exports = router;
