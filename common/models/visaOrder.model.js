const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const visaOrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    visaCategory: {
      type: Schema.Types.ObjectId,
      ref: "VisaCategory",
    },
    travellersCount: Number,
    from: Date,
    to: Date,
    applicationType: String,
    status: {
      type: String,
      default: "pending",
      enum: [
        "pending",
        "approved",
        "rejected",
        "sent-back",
        "sent-to-immigration",
        "blacklist",
      ],
    },
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    totalAmount: Number,
    gst: Number,
    insurance: {
      type: Boolean,
    },
    insurancePrice: Number,
    pricePerUser: Number,
    discount: Number,
    document: String,
    description: String,
  },
  { timestamps: true }
);

const VisaOrder = mongoose.model("VisaOrder", visaOrderSchema);

module.exports = VisaOrder;
