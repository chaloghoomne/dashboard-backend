const documentController = require("../controllers/document.controller");
const router = require("express").Router();
const { upload } = require("../../utils/upload");

router.post("/add-document", upload, documentController.addDocument);
router.get("/documents", documentController.getDocuments);
router.get("/document/:id", documentController.getDocumentById);
router.put("/edit-document/:id", upload, documentController.editDocument);
router.delete("/delete-document/:id", documentController.deleteDocument);

module.exports = router;
