const mongoose = require("mongoose");

const blogsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imageAlt: { type: String},
    description: { type: String, required: true },
    publisher: { type: String, required: true },
    readingTime: { type: Number, required: true },
    metaTitle: { type: String, default: "" },

    metaDescription: { type: String, default: "" },
    metaKeywords: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogsSchema);

module.exports = Blog;
