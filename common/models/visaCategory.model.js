const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const visaCategorySchema = new Schema(
  {
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    visaTypeHeading: String,
    tourType: mongoose.Schema.Types.ObjectId,
    price: Number,
    childPrice: Number,
    processingTime: String,
    icon: String,
    image: String,
    entryType: String,
    period: Number,
    validity: Number,
    planDisclaimer: [
      {
        type: String,
      },
    ],
    documents: [],
    importantInfo: [
      {
        type: String,
      },
    ],
    faq: [
      {
        question: String,
        answer: String,
      },
    ],
    expressHeading: String,
    expressPrice: Number,
    expressDays: Number,
    instantHeading: String,
    instantPrice: Number,
    instantDays: Number,
    type: String,
    discount: Number,
    insuranceAmount: String,
    longDescription: String,
  },
  { timestamps: true }
);

const VisaCategory = mongoose.model("VisaCategory", visaCategorySchema);

module.exports = VisaCategory;
