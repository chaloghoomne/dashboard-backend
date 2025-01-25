const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema(
  {
    name: { type: String },
    skills: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    currentDesignation: { type: String },
    position: { type: String },
    resume: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

const Career = mongoose.model("Career", careerSchema);

module.exports = Career;
