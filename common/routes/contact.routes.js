const contactController = require("../controllers/contact.controller");
const router = require("express").Router();

router.post("/contact", contactController.addContact);
router.get("/contact", contactController.getContact);
router.delete("/contact/:id", contactController.deleteContact);

module.exports = router;
