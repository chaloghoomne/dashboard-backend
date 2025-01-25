const mongoose = require("mongoose");

const tourTypeSchema = new mongoose.Schema(
  {
    name: String,
    image: String,
  },
  { timestamps: true }
);

const TourType = mongoose.model("TourType", tourTypeSchema);

module.exports = TourType;
