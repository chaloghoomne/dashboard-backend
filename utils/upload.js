const multer = require("multer");
const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});

const upload = multer({ storage }).fields([
  { name: "image" },
  { name: "icon" },
  { name: "tourTypes" },
  { name: "selfie" },
  { name: "passportFront" },
  { name: "passportBack" },
  { name: "additional" },
  { name: "documents" },
]);

module.exports = { upload };
