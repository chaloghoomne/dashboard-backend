const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

const About = mongoose.model("About", aboutSchema);

module.exports = About;
