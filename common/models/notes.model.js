const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notesSchema = new Schema(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
    },
    type: String,
    heading: String,
    description: String,
    image: String,
    points: [String],
  },
  { timestamps: true }
);

const NoteSchema = mongoose.model("Note", notesSchema);

module.exports = NoteSchema;
