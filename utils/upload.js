const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage }).array("documents"); // ✅ Ensure correct field name

module.exports = { upload };
