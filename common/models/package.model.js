const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const documentSchema = new Schema({
  name: String,
  image: String,
});

const packageSchema = new Schema(
  {
    tourTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: "TourType" }],
    heading: String,
    country: String,
    city: String,
    image: String,
    description: String,
    price: Number,
    faq: [
      {
        question: String,
        answer: String,
      },
    ],
    rating: Number,
    showCoTraveller: Boolean,
    documents: [documentSchema],
    docHeading: String,
    docDescription: String,
    docPoints: [],
    rank: { type: Number },
  },
  { timestamps: true }
);

const Package = mongoose.model("Package", packageSchema);

module.exports = Package;
