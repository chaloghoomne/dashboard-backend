const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = await Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
