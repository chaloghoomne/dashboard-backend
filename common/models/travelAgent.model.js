const mongoose = require("mongoose");

const travelAgentSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

const TravelAgent = mongoose.model("TravelAgent", travelAgentSchema);

module.exports = TravelAgent;
