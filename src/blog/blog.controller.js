const Blog = require('./blog.model');

// ১. নতুন ব্লগ তৈরি করা (Create Blog)
exports.createBlog = async (req, res) => {
  try {
    const { title, content, category, image } = req.body;

    if (!title || !content || !image) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, content, and image are required fields." 
      });
    }

    const newBlog = new Blog({
      title,
      content,
      category,
      image // Image URL from Cloudinary via /uploadImage API
    });

    await newBlog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully!",
      data: newBlog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create blog",
      error: error.message
    });
  }
};

// ২. সব ব্লগ লিস্ট আনা (Get All Blogs)
exports.getAllBlogs = async (req, res) => {
  try {
    // নতুন ব্লগগুলো সবার আগে দেখাবে
    const blogs = await Blog.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message
    });
  }
};

// ৩. একটি নির্দিষ্ট ব্লগ আনা (Get Single Blog by ID)
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found"
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Invalid blog ID or server error",
      error: error.message
    });
  }
};

// ৪. ব্লগ আপডেট করা (Update Blog)
exports.updateBlog = async (req, res) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found to update"
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog updated successfully!",
      data: updatedBlog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error: error.message
    });
  }
};

// ৫. ব্লগ ডিলিট করা (Delete Blog)
exports.deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found to delete"
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog post deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error: error.message
    });
  }
};