const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const partnerSchema = new Schema(
  {
    title: String,
    heading: String,
    travellersCount: Number,
    image: String,
    link: String,
    type: String,
  },
  { timestamps: true }
);

const Partner = mongoose.model("Partner", partnerSchema);

module.exports = Partner;
