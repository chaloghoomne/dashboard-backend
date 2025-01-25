const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pageTypeSchema = new Schema(
  {
    title: String,
    heading: String,
    subHeading: String,
    description: String,
    shortDescription: String,
    type: String,
    subItems: [Schema.Types.Mixed], // Allows any type of object in the array
  },
  { timestamps: true }
);

const PageType = mongoose.model("PageType", pageTypeSchema);

module.exports = PageType;
