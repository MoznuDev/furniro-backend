const products = require("./product.model");
const reviewsModel = require("../reviews/review.model"); 
// ⚠️ আপনার ফোল্ডার ও ফাইলের আসল স্পেলিং মিলিয়ে নিশ্চিত হয়ে নিন
const { errorResponse, successResponse } = require("../utilis/responsHandler");

// ১. Create New Product 
const createNewProduct = async (req, res) => {
    try {
        if (Array.isArray(req.body)) {
            const productsWithAuthor = req.body.map(item => ({
                ...item,
                author: req.user?._id || req.user?.id || item.author
            }));
            const savedProducts = await products.insertMany(productsWithAuthor);
            return successResponse(res, 201, 'All products created successfully', savedProducts);
        }

        const newProduct = new products({
            ...req.body,
            author: req.user?._id || req.user?.id || req.body.author
        });

        const savedProduct = await newProduct.save();
        return successResponse(res, 201, 'Product created successfully', savedProduct);
    } catch (error) {
        console.error("Create Product Error:", error);
        return errorResponse(res, 500, "Failed to create a new product", error.message || error.toString());
    }
};

// ২. Get All Products (FIXED)
const getAllProducts = async (req, res) => {
    try {
        const { category, color, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;
        const filter = {};
        
        if (category && category !== 'all') {
            filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }
        if (color && color !== 'all') {
            filter.color = { $regex: new RegExp(`^${color}$`, 'i') };
        }
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        
        if ((minPrice !== undefined && minPrice !== '') || (maxPrice !== undefined && maxPrice !== '')) {
            filter.price = {};
            if (minPrice !== undefined && minPrice !== '') {
                filter.price.$gte = parseFloat(minPrice);
            }
            if (maxPrice !== undefined && maxPrice !== '' && maxPrice !== 'null') {
                filter.price.$lte = parseFloat(maxPrice);
            }
        }

        const currentPage = Math.max(1, parseInt(page));
        const limitPerPage = Math.max(1, parseInt(limit));
        const skip = (currentPage - 1) * limitPerPage;

        // Populate Safe করার জন্য try catch wrapping বা নরমাল ফেচ
        const [allProducts, totalProducts] = await Promise.all([
            products.find(filter)
                .skip(skip)
                .limit(limitPerPage)
                .populate({ path: 'author', select: 'email username', strictPopulate: false })
                .sort({ createdAt: -1 }), 
            products.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalProducts / limitPerPage);

        return successResponse(res, 200, 'Products fetched successfully', {
            products: allProducts,
            totalProducts,
            totalPages,
            currentPage,
            limitPerPage
        });
    } catch (error) {
        console.error("GetAllProducts Error:", error);
        // ⚠️ error.message না থাকলেও আসল স্ট্রিং বা অবজেক্ট পাঠাবে
        const detailedError = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        return errorResponse(res, 500, "Failed to fetch products", detailedError);
    }
};

// ৩. Get Single Product 
const getSingleProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await products.findById(id).populate({ path: 'author', select: 'username email', strictPopulate: false });
        
        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }

        const reviews = await reviewsModel.find({ productId: id }).populate({ path: 'userId', select: 'username email', strictPopulate: false });
        
        return successResponse(res, 200, "Single product and reviews", { 
            product, 
            reviews 
        });
    } catch (error) {
        console.error("GetSingleProduct Error:", error);
        return errorResponse(res, 500, "Failed to get single product", error.message || error.toString());
    }
};

// ৪. Update a product by ID
const updateProductById = async (req, res) => {
    try {
        const { id } = req.params; 
        const updatedProduct = await products.findByIdAndUpdate(
            id, 
            { ...req.body }, 
            { new: true, runValidators: true } 
        );

        if (!updatedProduct) {
            return errorResponse(res, 404, "Product not found");
        }

        return successResponse(res, 200, 'Product updated successfully', updatedProduct);
    } catch (error) {
        console.error("UpdateProduct Error:", error);
        return errorResponse(res, 500, "Failed to update product", error.message || error.toString());
    }
};

// ৫. Delete Product 
const deleteProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const deletedProduct = await products.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return errorResponse(res, 404, 'Product not found');
        }

        await reviewsModel.deleteMany({ productId: productId });
        
        return successResponse(res, 200, "Product and its reviews deleted successfully");
    } catch (error) {
        console.error("DeleteProduct Error:", error);
        return errorResponse(res, 500, 'Failed to delete product', error.message || error.toString());
    }
};

module.exports = {
    createNewProduct,
    getAllProducts,
    getSingleProduct,
    updateProductById,
    deleteProductById
};