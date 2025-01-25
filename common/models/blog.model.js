const mongoose = require("mongoose");

const blogsSchema = new mongoose.Schema(
  {
    title: String,
    imageUrl: String,
    description: String,
    publisher: String,
    readingTime: Number,
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogsSchema);

module.exports = Blog;
