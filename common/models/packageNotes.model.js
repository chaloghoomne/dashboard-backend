const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const packageNotesSchema = new Schema(
  {
    type: String,
    heading: String,
    description: String,
    point: String,
  },
  { timestamps: true }
);

const PackageNote = mongoose.model("PackageNote", packageNotesSchema);

module.exports = PackageNote;
