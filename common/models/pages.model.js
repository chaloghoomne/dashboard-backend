const mongoose = require("mongoose");

const pagesSchema = new mongoose.Schema(
  {
    title: String,
    heading: String,
    description: String,
    imageUrl: String,
    sections: [
      {
        heading: { type: String },
        point: [String],
        summary: [String],
        description: String,
      },
    ],
    pageType: String,
  },
  { timestamps: true }
);

const Pages = mongoose.model("Pages", pagesSchema);

module.exports = Pages;
