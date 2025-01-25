const Contact = require("../models/contact.model");

module.exports = {
  async addContact(req, res) {
    try {
      const data = req.body;
      let contact = await Contact.findOne();

      if (!contact) {
        contact = await Contact.create(data);
      } else {
        contact = await Contact.findOneAndUpdate(
          contact._id,
          { $set: data },
          {
            new: true,
          }
        );
      }
      return res.status(201).json({
        data: contact,
        message: "Contact Added Successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async getContact(req, res) {
    try {
      const contact = await Contact.findOne();
      return res.status(200).json({
        data: contact,
        message: "Contact Fetched Successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async deleteContact(req, res) {
    try {
      const contact = await Contact.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        data: contact,
        message: "Contact Deleted Successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },
};
