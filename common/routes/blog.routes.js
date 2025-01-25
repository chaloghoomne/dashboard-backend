const blogController = require("../controllers/blog.controller");
const router = require("express").Router();
const { upload } = require("../../utils/upload");

router.post("/add-blog", upload, blogController.addBlog);
router.put("/edit-blog/:id", upload, blogController.editBlog);
router.get("/blogs", blogController.getAllBlogs);
router.get("/blog/:id", blogController.getBlogById);
router.delete("/blog/:id", blogController.deleteBlog);

module.exports = router;
