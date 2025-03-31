const multer = require("multer");

const storage = multer.memoryStorage(); // Store files in memory

const upload = multer({ storage }).any(); // 👈 Accepts files with any field name

module.exports = { upload };
