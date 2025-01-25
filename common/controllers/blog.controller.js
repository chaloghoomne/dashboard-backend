const { notificationQueue } = require("../../queue/notification.queue");
const User = require("../../user/models/user.model");
const paginate = require("../../utils/paginate");
const uploadImages = require("../../utils/uploadImages");
const uploadToBunny = require("../../utils/uploadToBunny");
const Blog = require("../models/blog.model");

module.exports = {
  async addBlog(req, res) {
    try {
      const data = req.body;

      const blogImage =
        req.files && req.files.image ? req.files.image[0] : null;

      let imageUrl = null;

      if (blogImage) {
        const fileBuffer = blogImage.buffer;
        const fileName = `${Date.now()}-${blogImage.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          imageUrl = uploadImage.cdnUrl;
        }
      }

      const blog = await Blog.create({ ...data, imageUrl });

      // const images = [];

      // if (blogImage) {
      //   images.push({
      //     buffer: blogImage.buffer,
      //     originalname: blogImage.originalname,
      //     mimetype: blogImage.mimetype,
      //     filename: blogImage.filename,
      //     id: blog._id,
      //     modelName: "Blog",
      //     field: "imageUrl",
      //   });
      // }

      // if (images.length > 0) {
      //   uploadImages(images)
      //     .then((results) => {
      //       console.log("All uploads completed", results);
      //       // Handle the results as needed
      //     })
      //     .catch((error) => {
      //       console.error("Error in batch upload:", error);
      //     });
      // }

      // find all user ids whose isblocked is not true
      const users = await User.find({ isBlocked: { $ne: true } }).select("_id");
      const userIds = users.map((user) => user._id.toString());

      const jobId = `notification-${Date.now()}`;
      await notificationQueue.add(jobId, {
        title: "New Blog Added",
        body: "A new blog has been added. Check it out!",
        image: null,
        userIds: userIds,
      });

      return res.status(200).json({
        message: "Blog added successfully",
        data: blog,
        success: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
        success: false,
      });
    }
  },

  async editBlog(req, res) {
    try {
      const { id } = req.params;
      let data = req.body;

      const blogImage =
        req.files && req.files.image ? req.files.image[0] : null;

      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({
          message: "Blog not found",
          success: false,
        });
      }

      if (blogImage) {
        const fileBuffer = blogImage.buffer;
        const fileName = `${Date.now()}-${blogImage.originalname}`;
        const uploadImage = await uploadToBunny(fileBuffer, fileName);
        if (uploadImage.success) {
          data.imageUrl = uploadImage.cdnUrl;
        }
      }

      const updateFields = { ...data };

      const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
      );

      // const images = [];

      // if (blogImage) {
      //   images.push({
      //     buffer: blogImage.buffer,
      //     originalname: blogImage.originalname,
      //     mimetype: blogImage.mimetype,
      //     filename: blogImage.filename,
      //     id: id,
      //     modelName: "Blog",
      //     field: "imageUrl",
      //   });
      // }

      // if (images.length > 0) {
      //   const uploadResults = await uploadImages(images);

      //   uploadResults.forEach((result) => {
      //     if (result.success) {
      //       updateFields[result.field] = result.url;
      //     }
      //   });
      // }

      // const updatedBlog = await Blog.findByIdAndUpdate(
      //   id,
      //   { $set: updateFields },
      //   { new: true }
      // );

      return res.status(200).json({
        message: "Blog updated successfully",
        data: updatedBlog,
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

  async getAllBlogs(req, res) {
    try {
      const { page, limit } = req.query;
      const { skip, take } = paginate(page, limit);

      const totalItems = await Blog.countDocuments();
      const totalPages = Math.ceil(totalItems / take);
      const startNumber = (page ? (page - 1) * take : 0) + 1;

      // Fetch blogs with or without pagination
      let blogs = await Blog.find()
        .skip(skip)
        .limit(take)
        .sort({ createdAt: -1 });

      // Add serial numbers
      blogs = blogs.map((item, index) => ({
        ...item._doc,
        s_no: startNumber + index,
      }));

      return res.status(200).json({
        message: "Blogs fetched successfully",
        data: blogs,
        totalPages,
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

  async getBlogById(req, res) {
    try {
      let id = req.params.id;

      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({
          message: "Blog not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Blog fetched successfully",
        data: blog,
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

  async deleteBlog(req, res) {
    try {
      const id = req.params.id;
      const blog = await Blog.findByIdAndDelete(id);

      if (!blog) {
        return res.status(404).json({
          message: "Blog not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Blog deleted successfully",
        data: blog,
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
