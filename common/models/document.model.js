const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    name: String,
    icon: String,
    description: String,
    show: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
