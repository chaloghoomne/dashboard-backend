const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  offices: [
    {
      city: { type: String },
      address: { type: String },
      phone: { type: String },
      email: { type: String },
    },
  ],
  supportEmail: { type: String },
  phoneNumber: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
});

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
