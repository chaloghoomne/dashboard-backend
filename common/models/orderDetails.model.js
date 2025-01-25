const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderDetailsSchema = new Schema(
  {
    visaOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisaOrder",
    },
    firstName: String,
    lastName: String,
    fatherName: String,
    motherName: String,
    gender: String,
    dob: String,
    passportNumber: String,
    passportIssueDate: Date,
    passportValidTill: Date,
    ageGroup: {
      type: String,
    },
    documents: [
      {
        name: String,
        image: String,
      },
    ],
    detailsFulfilled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const OrderDetails = mongoose.model("OrderDetails", orderDetailsSchema);

module.exports = OrderDetails;
