const express = require("express");

const router = express.Router();

const {getBlogs, searchBlog} = require("../middleware/blogController");

router.get("/blog-stats", getBlogs);
router.get("/blog-search", searchBlog);


module.exports = router;
