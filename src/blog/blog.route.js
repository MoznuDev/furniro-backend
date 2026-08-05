const express = require('express');
const router = express.Router();
const { 
  createBlog, 
  getAllBlogs, 
  getBlogById, 
  updateBlog, 
  deleteBlog 
} = require('./blog.controller');

// Routes mapping
router.post('/create', createBlog);
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.patch('/update/:id', updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;