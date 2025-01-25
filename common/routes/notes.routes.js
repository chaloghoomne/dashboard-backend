const noteController = require("../controllers/notes.controller");
const { upload } = require("../../utils/upload");
const router = require("express").Router();

router.post("/add-note", upload, noteController.addNotes);
router.get("/notes", noteController.getNotes);
router.get("/notes/:id", noteController.getNoteById);
router.put("/edit-note/:id", upload, noteController.editNote);
router.delete("/notes/:id", noteController.deleteNote);
router.get("/note-by-type/:type", noteController.getNoteByType);
router.get("/notes-by-package/:packageId", noteController.getNotesByPackage);

module.exports = router;
